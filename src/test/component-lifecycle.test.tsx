import { expect } from "chai";
import { component } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import "./types.js";

describe("Magic Loop Component - Lifecycle Callbacks", () => {

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should call onConnected when component is added to DOM", async () => {
    let connectedCalled = false;

    component(
      "connect-test",
      async function* () {
        yield <div>Test Component</div>;
      },
      {},
      {
        onConnected: () => {
          connectedCalled = true;
        },
      }
    );

    const element = document.createElement("connect-test");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(connectedCalled).to.be.true;
  });

  it("should call onDisconnected when component is removed from DOM", async () => {
    let disconnectedCalled = false;

    component(
      "disconnect-test",
      async function* () {
        yield <div>Test Component</div>;
      },
      {},
      {
        onDisconnected: () => {
          disconnectedCalled = true;
        },
      }
    );

    const element = document.createElement("disconnect-test");
    document.body.appendChild(element);
    await new Promise((resolve) => setTimeout(resolve, 0));

    element.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(disconnectedCalled).to.be.true;
  });

  it("should handle multiple connect/disconnect cycles", async () => {
    let connectCount = 0;
    let disconnectCount = 0;

    component(
      "lifecycle-cycles",
      async function* () {
        yield <div>Test Component</div>;
      },
      {},
      {
        onConnected: () => {
          connectCount++;
        },
        onDisconnected: () => {
          disconnectCount++;
        },
      }
    );

    const element = document.createElement("lifecycle-cycles");

    // First cycle
    document.body.appendChild(element);
    await new Promise((resolve) => setTimeout(resolve, 0));
    element.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Second cycle
    document.body.appendChild(element);
    await new Promise((resolve) => setTimeout(resolve, 0));
    element.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(connectCount).to.equal(2);
    expect(disconnectCount).to.equal(2);
  });

  it("should maintain component state through connect/disconnect cycles", async () => {
    let connectCount = 0;
    let stateValue = "";

    component(
      "lifecycle-state",
      async function* (component) {
        let state = "initial";

        const updateState = () => {
          state = "updated";
          component.render();
        };

        while (true) {
          yield (
            <div>
              <span data-testid="state">{state}</span>
              <button onclick={updateState} data-testid="update">
                Update
              </button>
            </div>
          );
        }
      },
      {},
      {
        onConnected: () => {
          connectCount++;
        },
      }
    );

    const element = document.createElement("lifecycle-state");
    document.body.appendChild(element);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Update state
    const button = element.querySelector(
      '[data-testid="update"]'
    ) as HTMLElement;
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Check state before disconnect
    expect(
      element.querySelector('[data-testid="state"]')!.textContent
    ).to.equal("updated");

    // Disconnect and reconnect
    element.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    document.body.appendChild(element);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // The state should be preserved since we're reusing the same component instance
    expect(connectCount).to.equal(2);
    expect(
      element.querySelector('[data-testid="state"]')!.textContent
    ).to.equal(
      "updated" // Changed from "initial" to "updated" since state persists
    );
  });
});
