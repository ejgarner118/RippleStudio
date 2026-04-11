import { describe, it, expect } from "vitest";
import { defaultBoardCadSettings, loadSettingsJson, saveSettingsJson } from "./store.js";

describe("settings store", () => {
  it("round-trips JSON", () => {
    const s = defaultBoardCadSettings();
    s.recentFiles.push("a.brd");
    const json = saveSettingsJson(s);
    const b = loadSettingsJson(json);
    expect(b.recentFiles).toEqual(["a.brd"]);
  });
});
