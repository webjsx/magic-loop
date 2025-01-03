import * as webjsx from "webjsx";

export type PropType = string | number | boolean | object | null | undefined;
export type FunctionPropType = (...args: any[]) => any;

export interface MagicLoopComponent {
  render(): void;
}

export type PageGenerator = (
  params: Record<string, string>,
  query: string
) => AsyncGenerator<webjsx.VNode, webjsx.VNode | void, void>;

export type ComponentGenerator<TProps> = (
  component: HTMLElement & MagicLoopComponent & TProps
) => AsyncGenerator<webjsx.VNode, webjsx.VNode | void, void>;

export interface ComponentOptions<TProps> {
  shadow?: "open" | "closed";
  styles?: string;
  adoptedStyleSheets?: CSSStyleSheet[];
  onConnected?: (component: HTMLElement & MagicLoopComponent & TProps) => void;
  onDisconnected?: (component: HTMLElement & MagicLoopComponent & TProps) => void;
  extends?: typeof HTMLElement;
}
