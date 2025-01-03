import { JSDOM } from "jsdom";
import { install } from "source-map-support";

// Install source map support for better error stack traces
install();

/**
 * Sets up a new JSDOM instance and assigns its window and document to globalThis.
 * Returns the JSDOM instance so that window.close() can be called after tests.
 *
 * @param html - The initial HTML to load into JSDOM.
 * @returns The JSDOM instance.
 */
export function setupJSDOM(
  html: string = `<!DOCTYPE html><body><div id="app"></div></body>`,
  url: string = "http://localhost"
) {
  const dom = new JSDOM(html, {
    url,
    runScripts: "dangerously",
    resources: "usable",
  });

  const { window } = dom;

  // Assign JSDOM globals to the Node.js global scope
  (globalThis as any).window = window;
  (globalThis as any).document = window.document;
  globalThis.Element = window.Element;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  globalThis.customElements = window.customElements;

  // Optionally, assign other necessary globals
  // e.g., Event, CustomEvent, etc.
  globalThis.Event = window.Event;
  globalThis.CustomEvent = window.CustomEvent;
  global.history = window.history;

  return dom;
}
