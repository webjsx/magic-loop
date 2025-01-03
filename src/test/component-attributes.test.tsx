import { expect } from "chai";
import { component } from "../index.js";
import "./setup.js";
import { setupJSDOM } from "./setup.js";
import "./types.js";

describe("Magic Loop Component - Attributes", () => {

  beforeEach(() => {
    setupJSDOM();
    const appElement = document.createElement("div");
    appElement.id = "app";
    document.body.appendChild(appElement);
  });

  afterEach(() => {
    window.close();
  });

  it("should pass all attributes as object to generator", async () => {
    let webComponent: (HTMLElement & { foo: string; hello: string }) | null =
      null;

    component(
      "attr-test",
      async function* (component) {
        webComponent = component;
        yield <div>Test</div>;
      },
      { foo: "bar", hello: "world" }
    );

    const element = document.createElement("attr-test");
    element.setAttribute("foo", "baz");
    element.setAttribute("hello", "universe");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(webComponent!.foo).to.equal("baz");
    expect(webComponent!.hello).to.equal("universe");
  });

  it("should update attributes object when attributes change", async () => {
    let webComponent: (HTMLElement & { foo: string }) | null;

    component(
      "attr-update-test",
      async function* (component) {
        webComponent = component;
        yield <div>Test</div>;
      },
      { foo: "" }
    );

    const element = document.createElement("attr-update-test");
    element.setAttribute("foo", "bar");
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 0));
    element.setAttribute("foo", "baz");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(webComponent!.foo).to.equal("baz");
  });
});
