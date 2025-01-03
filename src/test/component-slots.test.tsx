import { expect } from "chai";
import { component } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import "./types.js";

describe("Magic Loop Component - Slots", () => {

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should render content in default slot", async () => {
    component(
      "default-slot",
      async function* () {
        yield (
          <div class="wrapper">
            <slot>Default Content</slot>
          </div>
        );
      },
      {},
      { shadow: "open" }
    );

    const element = document.createElement("default-slot");
    element.innerHTML = "<p>Slotted Content</p>";
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const slot = element.shadowRoot!.querySelector("slot");
    expect(slot).to.exist;

    const assignedNodes = (slot as HTMLSlotElement).assignedNodes();
    expect(assignedNodes).to.have.lengthOf(1);
    expect(assignedNodes[0].textContent).to.equal("Slotted Content");
  });

  it("should render content in named slots", async () => {
    component(
      "named-slot",
      async function* () {
        yield (
          <div class="wrapper">
            <header>
              <slot name="header">Default Header</slot>
            </header>
            <main>
              <slot>Default Content</slot>
            </main>
            <footer>
              <slot name="footer">Default Footer</slot>
            </footer>
          </div>
        );
      },
      {},
      { shadow: "open" }
    );

    const element = document.createElement("named-slot");

    // Create and append elements directly
    const header = document.createElement("h1");
    header.setAttribute("slot", "header");
    header.textContent = "Header Content";

    const main = document.createElement("p");
    main.textContent = "Main Content";

    const footer = document.createElement("div");
    footer.setAttribute("slot", "footer");
    footer.textContent = "Footer Content";

    element.appendChild(header);
    element.appendChild(main);
    element.appendChild(footer);

    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const headerSlot = element.shadowRoot!.querySelector(
      'slot[name="header"]'
    ) as HTMLSlotElement;
    const mainSlot = element.shadowRoot!.querySelector(
      "slot:not([name])"
    ) as HTMLSlotElement;
    const footerSlot = element.shadowRoot!.querySelector(
      'slot[name="footer"]'
    ) as HTMLSlotElement;

    expect(headerSlot.assignedNodes()[0].textContent).to.equal(
      "Header Content"
    );
    expect(mainSlot.assignedNodes()[0].textContent).to.equal("Main Content");
    expect(footerSlot.assignedNodes()[0].textContent).to.equal(
      "Footer Content"
    );
  });

  it("should show fallback content when slot is empty", async () => {
    component(
      "fallback-slot",
      async function* () {
        yield (
          <div class="wrapper">
            <slot>Fallback Content</slot>
          </div>
        );
      },
      {},
      { shadow: "open" }
    );

    const element = document.createElement("fallback-slot");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const slot = element.shadowRoot!.querySelector("slot") as HTMLSlotElement;
    const assignedNodes = slot.assignedNodes({ flatten: true });
    expect(assignedNodes[0].textContent).to.equal("Fallback Content");
  });

  it("should update slot content when children change", async () => {
    component(
      "dynamic-slot",
      async function* () {
        yield (
          <div class="wrapper">
            <slot></slot>
          </div>
        );
      },
      {},
      { shadow: "open" }
    );

    const element = document.createElement("dynamic-slot");
    element.innerHTML = "<p>Initial Content</p>";
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const slot = element.shadowRoot!.querySelector("slot") as HTMLSlotElement;
    expect(slot.assignedNodes()[0].textContent).to.equal("Initial Content");

    // Update content
    element.innerHTML = "<p>Updated Content</p>";
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(slot.assignedNodes()[0].textContent).to.equal("Updated Content");
  });

  it("should handle nested components with slots", async () => {
    // Inner component with slot
    component(
      "inner-slot",
      async function* () {
        yield (
          <div class="inner">
            <slot></slot>
          </div>
        );
      },
      {},
      { shadow: "open" }
    );

    // Outer component that uses inner component
    component(
      "outer-slot",
      async function* () {
        yield (
          <div class="outer">
            <inner-slot>
              <slot></slot>
            </inner-slot>
          </div>
        );
      },
      {},
      { shadow: "open" }
    );

    const element = document.createElement("outer-slot");
    element.innerHTML = "<p>Nested Content</p>";
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const outerSlot = element.shadowRoot!.querySelector(
      "slot"
    ) as HTMLSlotElement;
    const innerComponent = element.shadowRoot!.querySelector("inner-slot");
    const innerSlot = innerComponent!.shadowRoot!.querySelector(
      "slot"
    ) as HTMLSlotElement;

    expect(outerSlot.assignedNodes()[0].textContent).to.equal("Nested Content");
    expect(innerSlot.assignedNodes()[0]).to.equal(outerSlot);
  });
});
