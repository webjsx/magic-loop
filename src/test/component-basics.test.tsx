import { expect } from "chai";
import { component } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import "./types.js";

describe("Magic Loop Component - Basic Creation & Rendering", () => {

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should create a custom element with the specified name", () => {
    component(
      "test-component",
      async function* (component) {
        yield <div>Test Component</div>;
      }
    );

    const element = document.createElement("test-component");
    document.body.appendChild(element);

    expect(element).to.be.instanceOf(HTMLElement);
    expect(element.tagName.toLowerCase()).to.equal("test-component");
  });

  it("should automatically prefix component name if no hyphen provided", () => {
    component(
      "test",
      async function* (component) {
        yield <div>Test Component</div>;
      }
    );

    const element = document.createElement("magic-loop-test");
    document.body.appendChild(element);

    expect(element).to.be.instanceOf(HTMLElement);
    expect(element.tagName.toLowerCase()).to.equal("magic-loop-test");
  });

  it("should render content from generator", async () => {
    component(
      "test-content",
      async function* (component) {
        yield <div class="content">Generated Content</div>;
      }
    );

    const element = document.createElement("test-content");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const content = element.querySelector(".content");
    expect(content).to.not.be.null;
    expect(content!.textContent).to.equal("Generated Content");
  });

  it("should clean up when disconnected", async () => {
    let renderCount = 0;

    component(
      "cleanup-test",
      async function* (component) {
        while (true) {
          renderCount++;
          yield <div>Render {renderCount}</div>;
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    );

    const element = document.createElement("cleanup-test");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));
    const countAtRemoval = renderCount;
    element.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(renderCount).to.equal(countAtRemoval);
  });
});
