import * as webjsx from "webjsx";
import {
  ComponentGenerator,
  ComponentOptions,
  PropType,
  FunctionPropType,
  Component as Component,
} from "./types.js";

function isSerializableProp(value: any): boolean {
  const type = typeof value;
  return type === "string" || type === "number" || type === "boolean";
}

function deserializeAttribute(
  value: string | null,
  originalPropValue: any
): any {
  if (value === null) return value;
  const type = typeof originalPropValue;

  switch (type) {
    case "number":
      return Number(value);
    case "boolean":
      return value === "";
    default:
      return value;
  }
}

function serializeProp(value: any): string | null {
  if (typeof value === "boolean") {
    return value ? "" : null;
  }
  return String(value);
}

export function component<
  TProps extends { [K in keyof TProps]: PropType | FunctionPropType } = {}
>(
  name: string,
  generator: ComponentGenerator<TProps>,
  defaultProps: TProps = {} as TProps,
  options: ComponentOptions<TProps> = {}
): void {
  const observedProps = new Set<string>();
  const nonObservedProps = new Set<string>();

  for (const [key, value] of Object.entries(defaultProps)) {
    if (isSerializableProp(value)) {
      observedProps.add(key);
    } else {
      nonObservedProps.add(key);
    }
  }

  class MagicLoopComponent
    extends (options.extends ?? HTMLElement)
    implements Component
  {
    #iterator: AsyncGenerator<webjsx.VNode, webjsx.VNode | void, void>;
    #root: ShadowRoot | HTMLElement;
    #resolveUpdate: (() => void) | null = null;
    renderPromise: Promise<void> | null = null;
    props: Partial<TProps> = {};

    #_hasInitialized = false;

    constructor() {
      super();

      if (options.shadow) {
        this.#root = this.attachShadow({ mode: options.shadow });
        if (options.styles) {
          const style = document.createElement("style");
          style.textContent = options.styles;
          this.#root.appendChild(style);
        }
        if (options.adoptedStyleSheets) {
          this.#root.adoptedStyleSheets = options.adoptedStyleSheets;
        }
      } else {
        this.#root = this;
      }

      // Initialize non-serializable props in constructor
      Object.entries(defaultProps).forEach(([key, value]) => {
        if (!isSerializableProp(value)) {
          this.props[key as keyof TProps] = value as TProps[keyof TProps];
        }
      });

      this.#iterator = generator(
        this as unknown as HTMLElement & Component & TProps
      );
    }

    #ensureInitialization() {
      if (!this.#_hasInitialized) {
        // Initialize attributes only on first connect
        Object.entries(defaultProps).forEach(([key, value]) => {
          if (isSerializableProp(value)) {
            // Only set if no attribute exists
            if (!this.hasAttribute(key)) {
              const serialized = serializeProp(value);
              if (serialized !== null) {
                this.setAttribute(key, serialized);
              }
            }
          }
        });

        this.#_hasInitialized = true;

        this.#startRenderLoop();
      }
    }

    async connectedCallback() {
      options.onConnected?.(
        this as unknown as HTMLElement & Component & TProps
      );
      this.render();
    }

    async disconnectedCallback() {
      options.onDisconnected?.(
        this as unknown as HTMLElement & Component & TProps
      );
    }

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null
    ) {
      if (oldValue === newValue) return;

      const originalValue = defaultProps[name as keyof TProps];
      const oldParsedValue = deserializeAttribute(oldValue, originalValue);
      const newParsedValue = deserializeAttribute(newValue, originalValue);

      if (oldParsedValue !== newParsedValue) {
        this.props[name as keyof TProps] =
          newParsedValue as TProps[keyof TProps];
        this.render();
      }
    }

    render() {
      this.#ensureInitialization();

      this.renderPromise =
        this.renderPromise ??
        new Promise<void>((resolve) => {
          this.#resolveUpdate = resolve;
        });

      this.#resolveUpdate!();
    }

    async #startRenderLoop() {
      while (true) {
        await this.renderPromise;

        this.renderPromise = null;
        this.#resolveUpdate = null;

        const { value: vdom, done } = await this.#iterator.next();
        if (done) {
          if (vdom) {
            webjsx.applyDiff(this.#root, vdom);
          }
          break;
        } else {
          // if renderPromise is not null, someone else might have triggered another render.
          this.renderPromise =
            this.renderPromise ??
            new Promise<void>((resolve) => {
              this.#resolveUpdate = resolve;
            });

          webjsx.applyDiff(this.#root, vdom);
        }
      }
    }

    static get observedAttributes(): string[] {
      return Array.from(observedProps) as string[];
    }
  }

  for (const [propName, initialValue] of Object.entries(defaultProps)) {
    Object.defineProperty(MagicLoopComponent.prototype, propName, {
      get() {
        const thisItem: MagicLoopComponent = this;
        if (isSerializableProp(initialValue)) {
          const attr = thisItem.getAttribute(propName);
          return deserializeAttribute(attr, initialValue);
        } else {
          return thisItem.props[propName as keyof TProps];
        }
      },
      set(value) {
        const thisItem: MagicLoopComponent = this;
        if (isSerializableProp(initialValue)) {
          if (value === null) {
            thisItem.removeAttribute(propName);
          } else {
            const serialized = serializeProp(value);
            if (serialized === null) {
              thisItem.removeAttribute(propName);
            } else {
              thisItem.setAttribute(propName, serialized);
            }
          }
        } else {
          thisItem.props[propName as keyof TProps] =
            value as TProps[keyof TProps];
          thisItem.render();
        }
      },
      configurable: true,
      enumerable: true,
    });
  }

  const elementName = name.includes("-") ? name : `${name}-component`;
  if (!customElements.get(elementName)) {
    customElements.define(elementName, MagicLoopComponent);
  }
}
