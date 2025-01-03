import * as webjsx from "webjsx";

export type PropType = string | number | boolean | object | null | undefined;
export type FunctionPropType = (...args: any[]) => any;

export interface Component {
  render(): void;
}

export type PageGenerator = (
  params: Record<string, string>,
  query: string
) => AsyncGenerator<webjsx.VNode, webjsx.VNode | void, void>;

export type ComponentGenerator<TProps> = (
  component: HTMLElement & Component & TProps
) => AsyncGenerator<webjsx.VNode, webjsx.VNode | void, void>;

export interface ComponentOptions<TProps> {
  shadow?: "open" | "closed";
  styles?: string;
  adoptedStyleSheets?: CSSStyleSheet[];
  onConnected?: (component: HTMLElement & Component & TProps) => void;
  onDisconnected?: (component: HTMLElement & Component & TProps) => void;
  extends?: typeof HTMLElement;
}
