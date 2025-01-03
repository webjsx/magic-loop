import { expect } from "chai";
import { MagicLoopComponent, component } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import "./types.js";

describe("Magic Loop Component - Return Value", () => {

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should handle generators that return a final value", async () => {
    let phase = 0;
    
    component("return-test", async function* (component) {
      while (true) {
        if (phase === 0) {
          phase++;
          yield <div data-testid="loading">Loading...</div>;
        } else {
          return <div data-testid="final">Final Content</div>;
        }
      }
    });

    const element = document.createElement("return-test");
    document.body.appendChild(element);

    // Check initial state
    await new Promise((resolve) => setTimeout(resolve, 0));
    const loading = element.querySelector('[data-testid="loading"]');
    expect(loading).to.not.be.null;
    expect(loading!.textContent).to.equal("Loading...");

    // Trigger next render
    (element as unknown as MagicLoopComponent).render();
    await new Promise((resolve) => setTimeout(resolve, 0));
    
    const final = element.querySelector('[data-testid="final"]');
    expect(final).to.not.be.null;
    expect(final!.textContent).to.equal("Final Content");
  });

  it("should stop rendering after return", async () => {
    let renderCount = 0;
    let phase = 0;

    component("stop-after-return", async function* (component) {
      while (true) {
        renderCount++;
        if (phase === 0) {
          phase++;
          yield <div data-testid="initial">Initial State</div>;
        } else {
          return <div data-testid="final">Final State</div>;
        }
      }
    });

    const element = document.createElement("stop-after-return");
    document.body.appendChild(element);

    // Wait for initial render
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(renderCount).to.equal(1);

    // Trigger second render which should return
    (element as unknown as MagicLoopComponent).render();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(renderCount).to.equal(2);

    // Additional renders should not increment the count
    (element as unknown as MagicLoopComponent).render();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(renderCount).to.equal(2);
  });

  it("should handle both yield and return in async flow", async () => {
    let phase = 0;
    
    component("async-yield-return", async function* (component) {
      while (true) {
        if (phase === 0) {
          phase++;
          yield <div data-testid="step1">Step 1</div>;
        } else if (phase === 1) {
          phase++;
          yield <div data-testid="step2">Step 2</div>;
        } else {
          return <div data-testid="step3">Step 3</div>;
        }
      }
    });

    const element = document.createElement("async-yield-return");
    document.body.appendChild(element);

    // Check Step 1
    await new Promise((resolve) => setTimeout(resolve, 0));
    const step1 = element.querySelector('[data-testid="step1"]');
    expect(step1).to.not.be.null;
    expect(step1!.textContent).to.equal("Step 1");

    // Move to Step 2
    (element as unknown as MagicLoopComponent).render();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const step2 = element.querySelector('[data-testid="step2"]');
    expect(step2).to.not.be.null;
    expect(step2!.textContent).to.equal("Step 2");

    // Move to Final Step
    (element as unknown as MagicLoopComponent).render();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const step3 = element.querySelector('[data-testid="step3"]');
    expect(step3).to.not.be.null;
    expect(step3!.textContent).to.equal("Step 3");
  });
});