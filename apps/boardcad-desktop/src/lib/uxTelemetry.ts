type UxEventPayload = Record<string, string | number | boolean | null | undefined>;

const STORAGE_KEY = "ripple.ux.events.v1";
const MAX_EVENTS = 250;

export type UxEvent = {
  id: string;
  name: string;
  at: number;
  payload?: UxEventPayload;
};

function readEvents(): UxEvent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as UxEvent[]) : [];
  } catch {
    return [];
  }
}

function writeEvents(events: UxEvent[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export function trackUxEvent(name: string, payload?: UxEventPayload): void {
  const events = readEvents();
  events.push({
    id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    at: Date.now(),
    payload,
  });
  writeEvents(events);
}

export function listUxEvents(): UxEvent[] {
  return readEvents();
}

