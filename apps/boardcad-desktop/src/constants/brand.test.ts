import { describe, it, expect } from "vitest";
import { APP_DISPLAY_NAME, APP_VERSION_LABEL } from "./brand";

describe("brand", () => {
  it("exposes display name and semver from package", () => {
    expect(APP_DISPLAY_NAME.length).toBeGreaterThan(0);
    expect(APP_VERSION_LABEL).toMatch(/^\d+\.\d+\.\d+/);
  });
});
