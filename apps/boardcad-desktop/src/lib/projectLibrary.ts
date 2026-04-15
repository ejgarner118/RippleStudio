export type BoardSnapshotRecord = {
  id: string;
  title: string;
  createdAt: number;
  brdText: string;
};

export type ProjectRecord = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  rider?: string;
  waveType?: string;
  autosaveEnabled?: boolean;
  autosaveIntervalSec?: number;
  lastAutosaveAt?: number;
  snapshots: BoardSnapshotRecord[];
};

const STORAGE_KEY = "ripple.project.library.v1";

export function createProjectRecord(name: string): ProjectRecord {
  const now = Date.now();
  return {
    id: `proj_${now.toString(36)}`,
    name: name.trim() || "Untitled project",
    createdAt: now,
    updatedAt: now,
    tags: [],
    autosaveEnabled: true,
    autosaveIntervalSec: 30,
    snapshots: [],
  };
}

export function loadProjectLibrary(): ProjectRecord[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && typeof r === "object") as ProjectRecord[];
  } catch {
    return [];
  }
}

export function getProjectById(projectId: string | null, records: ProjectRecord[]): ProjectRecord | null {
  if (!projectId) return null;
  return records.find((p) => p.id === projectId) ?? null;
}

export function saveProjectLibrary(records: ProjectRecord[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function upsertProject(record: ProjectRecord): ProjectRecord[] {
  const all = loadProjectLibrary();
  const next = all.filter((p) => p.id !== record.id);
  next.unshift({ ...record, updatedAt: Date.now() });
  saveProjectLibrary(next);
  return next;
}

export function addProjectSnapshot(
  projectId: string,
  title: string,
  brdText: string,
): ProjectRecord[] {
  const all = loadProjectLibrary();
  const idx = all.findIndex((p) => p.id === projectId);
  if (idx < 0) return all;
  const project = all[idx]!;
  const snapshot: BoardSnapshotRecord = {
    id: `snap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim() || "Snapshot",
    createdAt: Date.now(),
    brdText,
  };
  const updated: ProjectRecord = {
    ...project,
    updatedAt: Date.now(),
    snapshots: [snapshot, ...project.snapshots].slice(0, 50),
  };
  all.splice(idx, 1, updated);
  saveProjectLibrary(all);
  return all;
}

export function updateProjectMetadata(
  projectId: string,
  patch: Partial<Pick<ProjectRecord, "name" | "rider" | "waveType" | "tags" | "autosaveEnabled" | "autosaveIntervalSec" | "lastAutosaveAt">>,
): ProjectRecord[] {
  const all = loadProjectLibrary();
  const idx = all.findIndex((p) => p.id === projectId);
  if (idx < 0) return all;
  const current = all[idx]!;
  const next: ProjectRecord = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  };
  all.splice(idx, 1, next);
  saveProjectLibrary(all);
  return all;
}

