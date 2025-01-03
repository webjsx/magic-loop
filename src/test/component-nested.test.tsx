import { expect } from "chai";
import { component } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import "./types.js";

describe("Magic Loop Component - Nested Components", () => {

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should handle nested components with independent state", async () => {
    component(
      "child-counter",
      async function* (component) {
        let count = component.initialcount;

        const increment = () => {
          count++;
          component.render();
        };

        while (true) {
          yield (
            <div>
              <span data-testid={`counter-${component.componentid}`}>
                {count}
              </span>
              <button
                onclick={increment}
                data-testid={`button-${component.componentid}`}
              >
                +
              </button>
            </div>
          );
        }
      },
      { initialcount: 0, componentid: 0 }
    );

    component(
      "parent-component",
      async function* (component) {
        let parentCount = 0;

        const incrementParent = () => {
          parentCount++;
          component.render();
        };

        while (true) {
          yield (
            <div>
              <span data-testid="parent-count">{parentCount}</span>
              <button onclick={incrementParent} data-testid="parent-button">
                +
              </button>
              <child-counter componentid="1" initialcount="0" />
              <child-counter componentid="2" initialcount="5" />
            </div>
          );
        }
      }
    );

    const element = document.createElement("parent-component");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const getParentCount = () =>
      element.querySelector('[data-testid="parent-count"]')!.textContent;
    const getChild1Count = () =>
      element.querySelector('[data-testid="counter-1"]')!.textContent;
    const getChild2Count = () =>
      element.querySelector('[data-testid="counter-2"]')!.textContent;

    const parentButton = element.querySelector(
      '[data-testid="parent-button"]'
    ) as HTMLElement;
    const child1Button = element.querySelector(
      '[data-testid="button-1"]'
    ) as HTMLElement;
    const child2Button = element.querySelector(
      '[data-testid="button-2"]'
    ) as HTMLElement;

    expect(getParentCount()).to.equal("0");
    expect(getChild1Count()).to.equal("0");
    expect(getChild2Count()).to.equal("5");

    parentButton.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getParentCount()).to.equal("1");
    expect(getChild1Count()).to.equal("0");
    expect(getChild2Count()).to.equal("5");

    child1Button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getParentCount()).to.equal("1");
    expect(getChild1Count()).to.equal("1");
    expect(getChild2Count()).to.equal("5");

    child2Button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getParentCount()).to.equal("1");
    expect(getChild1Count()).to.equal("1");
    expect(getChild2Count()).to.equal("6");
  });

  it("should update child component when parent passes new attributes", async () => {
    component(
      "display-attrs",
      async function* (component) {
        while (true) {
          yield (
            <div>
              <span data-testid="name">{component.name}</span>
              <span data-testid="value">{component.value}</span>
            </div>
          );
        }
      },
      { name: "", value: "" }
    );

    component(
      "parent-updater",
      async function* (component) {
        let currentValue = 0;

        const updateValue = () => {
          currentValue++;
          component.render();
        };

        while (true) {
          yield (
            <div>
              <display-attrs
                name="counter"
                value={currentValue.toString()}
                data-testid="display"
              />
              <button onclick={updateValue} data-testid="update">
                Update
              </button>
            </div>
          );
        }
      }
    );

    const element = document.createElement("parent-updater");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const childElement = element.querySelector('[data-testid="display"]')!;

    const getName = () =>
      childElement.querySelector('[data-testid="name"]')!.textContent;
    const getValue = () =>
      childElement.querySelector('[data-testid="value"]')!.textContent;

    const button = element.querySelector(
      '[data-testid="update"]'
    ) as HTMLElement;

    expect(getName()).to.equal("counter");
    expect(getValue()).to.equal("0");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getValue()).to.equal("1");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getValue()).to.equal("2");
  });
});
