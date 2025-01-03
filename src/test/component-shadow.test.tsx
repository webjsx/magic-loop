import { expect } from "chai";
import { component } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import "./types.js";

describe("Magic Loop Component - Shadow DOM", () => {

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should support shadow DOM with open mode", async () => {
    component(
      "shadow-test",
      async function* (component) {
        yield <div class="shadow-content">Shadow Content</div>;
      },
      {},
      { shadow: "open" }
    );

    const element = document.createElement("shadow-test");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const shadowRoot = element.shadowRoot;
    expect(shadowRoot).to.not.be.null;
    expect(shadowRoot!.mode).to.equal("open");

    const content = shadowRoot!.querySelector(".shadow-content");
    expect(content).to.not.be.null;
    expect(content!.textContent).to.equal("Shadow Content");
  });

  it("should support shadow DOM with closed mode", async () => {
    component(
      "shadow-closed-test",
      async function* (component) {
        yield <div class="shadow-content">Shadow Content</div>;
      },
      {},
      { shadow: "closed" }
    );

    const element = document.createElement("shadow-closed-test");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    // For closed shadow roots, shadowRoot will be null
    expect(element.shadowRoot).to.be.null;

    // But the content should still be isolated
    const content = element.querySelector(".shadow-content");
    expect(content).to.be.null;
  });

  it("should keep shadow DOM content isolated from main document", async () => {
    // Create a component with shadow DOM
    component(
      "shadow-isolated",
      async function* (component) {
        yield <div class="test-content">Shadow Content</div>;
      },
      {},
      { shadow: "open" }
    );

    // Create a regular component
    component(
      "regular-component",
      async function* (component) {
        yield <div class="test-content">Regular Content</div>;
      }
    );

    // Create both components
    const shadowElement = document.createElement("shadow-isolated");
    const regularElement = document.createElement("regular-component");
    document.body.appendChild(shadowElement);
    document.body.appendChild(regularElement);

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Query the main document
    const mainDocumentContent = document.querySelectorAll(".test-content");
    expect(mainDocumentContent.length).to.equal(1); // Only the regular component content

    // Query the shadow root
    const shadowContent =
      shadowElement.shadowRoot!.querySelectorAll(".test-content");
    expect(shadowContent.length).to.equal(1); // Only the shadow content
  });

  it("should support styling within shadow DOM", async () => {
    component(
      "shadow-styled",
      async function* (component) {
        yield (
          <div>
            <style>
              {`.styled-content { 
                color: red;
              }`}
            </style>
            <div class="styled-content">Styled Content</div>
          </div>
        );
      },
      {},
      { shadow: "open" }
    );

    const element = document.createElement("shadow-styled");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const shadow = element.shadowRoot;
    expect(shadow).to.not.be.null;

    // Check if style element exists and contains correct CSS
    const styleElement = shadow!.querySelector("style");
    expect(styleElement).to.not.be.null;
    expect(styleElement!.textContent!.replace(/\s+/g, " ").trim()).to.equal(
      ".styled-content { color: red; }"
    );

    // Check if content element exists with correct class
    const styledContent = shadow!.querySelector(".styled-content");
    expect(styledContent).to.not.be.null;
    expect(styledContent!.textContent).to.equal("Styled Content");
  });

  it("should handle events within shadow DOM", async () => {
    let clickCount = 0;

    component(
      "shadow-events",
      async function* (component) {
        const handleClick = () => {
          clickCount++;
          component.render();
        };

        while (true) {
          yield (
            <div>
              <button class="shadow-button" onclick={handleClick}>
                Click Me
              </button>
              <span class="click-count">{clickCount}</span>
            </div>
          );
        }
      },
      {},
      { shadow: "open" }
    );

    const element = document.createElement("shadow-events");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const button = element.shadowRoot!.querySelector(
      ".shadow-button"
    ) as HTMLElement;
    const countDisplay = element.shadowRoot!.querySelector(".click-count")!;

    expect(countDisplay.textContent).to.equal("0");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(countDisplay.textContent).to.equal("1");

    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(countDisplay.textContent).to.equal("2");
  });
});
