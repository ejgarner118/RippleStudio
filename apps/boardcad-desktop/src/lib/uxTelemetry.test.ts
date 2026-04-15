/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import { listUxEvents, trackUxEvent } from "./uxTelemetry";

describe("uxTelemetry", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores tracked events with payload", () => {
    trackUxEvent("board.created", { preset: "standard" });
    const events = listUxEvents();
    expect(events.length).toBe(1);
    expect(events[0]?.name).toBe("board.created");
    expect(events[0]?.payload?.preset).toBe("standard");
  });
});

