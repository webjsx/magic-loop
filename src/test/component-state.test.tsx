import { expect } from "chai";
import { component } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import "./types.js";

describe("Magic Loop Component - State & Interactivity", () => {

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should maintain state between renders", async () => {
    let renderCount = 0;

    component(
      "state-test",
      async function* (component) {
        let count = 0;

        const increment = () => {
          count++;
          renderCount++;
          component.render();
        };

        while (true) {
          yield (
            <div>
              <span data-testid="count">{count}</span>
              <button onclick={increment} data-testid="button">
                Increment
              </button>
            </div>
          );
        }
      }
    );

    const element = document.createElement("state-test");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const getCount = () =>
      element.querySelector('[data-testid="count"]')!.textContent;
    const button = element.querySelector(
      '[data-testid="button"]'
    ) as HTMLElement;

    expect(getCount()).to.equal("0");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getCount()).to.equal("1");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getCount()).to.equal("2");

    expect(renderCount).to.equal(2);
  });

  it("should handle multiple interactive elements", async () => {
    component(
      "multi-interactive",
      async function* (component) {
        let count = 0;
        let text = "";

        const increment = () => {
          count++;
          component.render();
        };

        const updateText = (e: Event) => {
          text = (e.target as HTMLInputElement).value;
          component.render();
        };

        while (true) {
          yield (
            <div>
              <span data-testid="count">{count}</span>
              <button onclick={increment} data-testid="button">
                +
              </button>
              <input
                type="text"
                value={text}
                oninput={updateText}
                data-testid="input"
              />
              <span data-testid="text">{text}</span>
            </div>
          );
        }
      }
    );

    const element = document.createElement("multi-interactive");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const getCount = () =>
      element.querySelector('[data-testid="count"]')!.textContent;
    const getText = () =>
      element.querySelector('[data-testid="text"]')!.textContent;
    const button = element.querySelector(
      '[data-testid="button"]'
    ) as HTMLElement;
    const input = element.querySelector(
      '[data-testid="input"]'
    ) as HTMLInputElement;

    expect(getCount()).to.equal("0");
    expect(getText()).to.equal("");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getCount()).to.equal("1");

    input.value = "Hello";
    input.dispatchEvent(new Event("input"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getText()).to.equal("Hello");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getCount()).to.equal("2");
    expect(getText()).to.equal("Hello");
  });
});
