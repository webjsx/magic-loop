import { expect } from "chai";
import { component, } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import "./types.js";

describe("Magic Loop Component - Function Props", () => {

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should handle function props", async () => {
    let clicked = false;

    component(
      "function-test",
      async function* (component) {
        yield (
          <button onclick={component.onClick} data-testid="button">
            Click me
          </button>
        );
      },
      { onClick: () => (clicked = true) }
    );

    const element = document.createElement("function-test");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const button = element.querySelector(
      '[data-testid="button"]'
    ) as HTMLElement;

    button.click();

    expect(clicked).to.be.true;
  });

  it("should update function props", async () => {
    let clickCount = 0;

    component(
      "updatable-function",
      async function* (component) {
        yield (
          <button onclick={() => component.onClick()} data-testid="button">
            Click me
          </button>
        );
      },
      { onClick: () => clickCount++ }
    );

    const element = document.createElement("updatable-function");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const button = element.querySelector(
      '[data-testid="button"]'
    ) as HTMLElement;
    button.click();
    expect(clickCount).to.equal(1);

    (element as any).onClick = () => (clickCount += 2);
    button.click();
    expect(clickCount).to.equal(3);
  });

  it("should handle mix of function and regular props", async () => {
    let clickValue = "";

    component(
      "mixed-props",
      async function* (component) {
        yield (
          <button
            onclick={() => component.onClick(component.value)}
            data-testid="button"
          >
            {component.value}
          </button>
        );
      },
      {
        onClick: (val: string) => {
          clickValue = val;
        },
        value: "test",
      }
    );

    const element = document.createElement("mixed-props");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const button = element.querySelector(
      '[data-testid="button"]'
    ) as HTMLElement;
    button.click();
    expect(clickValue).to.equal("test");

    element.setAttribute("value", "updated");
    await new Promise((resolve) => setTimeout(resolve, 0));

    button.click();
    expect(clickValue).to.equal("updated");
  });
});
