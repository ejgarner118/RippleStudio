import { describe, it, expect } from "vitest";
import { setLocale, t } from "./index.js";

describe("i18n", () => {
  it("resolves keys per locale", () => {
    setLocale("en");
    expect(t("FILEMENU_STR")).toBe("File");
    setLocale("fr");
    expect(t("FILEMENU_STR")).toBe("Fichier");
    setLocale("en");
  });
});
