/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { isTypingContext } from "./keyboardGuards";

describe("isTypingContext", () => {
  it("returns true for form fields", () => {
    expect(isTypingContext(document.createElement("input"))).toBe(true);
    expect(isTypingContext(document.createElement("textarea"))).toBe(true);
    expect(isTypingContext(document.createElement("select"))).toBe(true);
  });

  it("returns true for contenteditable containers", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    expect(isTypingContext(div)).toBe(true);
  });

  it("returns false for non-editable controls", () => {
    const button = document.createElement("button");
    expect(isTypingContext(button)).toBe(false);
  });
});
