import { describe, it, expect } from "vitest";
import { formatFsError } from "./fileIo";

describe("fileIo", () => {
  it("formatFsError prefers Error.message", () => {
    expect(formatFsError(new Error("disk full"))).toBe("disk full");
  });

  it("formatFsError stringifies unknown values", () => {
    expect(formatFsError(42)).toBe("42");
  });
});
