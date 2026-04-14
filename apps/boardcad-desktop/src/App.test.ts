/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { templatePresetForNewBoard } from "./App";

describe("templatePresetForNewBoard", () => {
  it("maps guided setup to Standard template", () => {
    expect(templatePresetForNewBoard("empty_guided")).toBe("standard");
  });

  it("keeps explicit template presets unchanged", () => {
    expect(templatePresetForNewBoard("shortboard")).toBe("shortboard");
    expect(templatePresetForNewBoard("fish")).toBe("fish");
  });
});
