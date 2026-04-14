/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { formatFsError, saveBoardTextAs } from "./fileIo";

describe("fileIo", () => {
  it("formatFsError prefers Error.message", () => {
    expect(formatFsError(new Error("disk full"))).toBe("disk full");
  });

  it("formatFsError stringifies unknown values", () => {
    expect(formatFsError(42)).toBe("42");
  });

  it("saveBoardTextAs falls back to download naming when picker is unavailable", async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    (URL as typeof URL & { createObjectURL: (blob: Blob) => string }).createObjectURL ??=
      (() => "blob:mock");
    (URL as typeof URL & { revokeObjectURL: (url: string) => void }).revokeObjectURL ??= (() => {});
    const createUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("named-board");
    const result = await saveBoardTextAs("default.brd", "abc");
    expect(result).toEqual({ path: "named-board.brd", method: "download" });
    expect(clickSpy).toHaveBeenCalled();
    promptSpy.mockRestore();
    clickSpy.mockRestore();
    createUrlSpy.mockRestore();
    revokeSpy.mockRestore();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });
});
