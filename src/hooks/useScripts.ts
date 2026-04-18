import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ScriptData, DEFAULT_SCRIPT_DATA, SavedScript } from '../types';
import type { Bridge } from '../lib/bridge';

const SCRIPTS_KEY = 'script-builder.scripts.v1';
const DRAFTS_KEY = 'script-builder.drafts.v1';
const ACTIVE_KEY = 'script-builder.activeId.v1';
const LEGACY_KEY = 'cold-call-script-data';
const MIGRATED_KEY = 'script-builder.migrated';

type DraftMap = Record<string, ScriptData>;

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeScript(name: string, script: ScriptData = DEFAULT_SCRIPT_DATA): SavedScript {
  const ts = nowIso();
  return {
    data_id: newId(),
    type: 'script',
    name,
    createdAt: ts,
    updatedAt: ts,
    script,
  };
}

function scriptsEqual(a: ScriptData, b: ScriptData): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function toWire(s: SavedScript): Omit<SavedScript, 'type'> {
  const { type: _type, ...rest } = s;
  return rest;
}

function hydrateFromBridge(bridge: Bridge): { scripts: SavedScript[]; activeId: string | null } {
  const scripts: SavedScript[] = [];
  for (const item of bridge.init.items) {
    const v = item.value as Partial<SavedScript> | null | undefined;
    if (!v || typeof v !== 'object') continue;
    const script = (v.script && typeof v.script === 'object')
      ? { ...DEFAULT_SCRIPT_DATA, ...v.script }
      : DEFAULT_SCRIPT_DATA;
    scripts.push({
      data_id: item.data_id,
      type: 'script',
      name: typeof v.name === 'string' && v.name.trim() ? v.name : 'Untitled Script',
      createdAt: typeof v.createdAt === 'string' ? v.createdAt : nowIso(),
      updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : nowIso(),
      script,
    });
  }
  const activeId = scripts[0]?.data_id ?? null;
  return { scripts, activeId };
}

function loadFromLocalStorage(): { scripts: SavedScript[]; drafts: DraftMap; activeId: string | null } {
  let scripts: SavedScript[] = [];

  try {
    const raw = localStorage.getItem(SCRIPTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedScript[];
      if (Array.isArray(parsed)) scripts = parsed;
    }
  } catch {}

  const alreadyMigrated = (() => {
    try { return localStorage.getItem(MIGRATED_KEY) === 'true'; } catch { return false; }
  })();
  if (scripts.length === 0 && !alreadyMigrated) {
    try {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        const migrated = makeScript('My Script', { ...DEFAULT_SCRIPT_DATA, ...parsed });
        scripts = [migrated];
        localStorage.removeItem(LEGACY_KEY);
        try { localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts)); } catch {}
      }
    } catch {}
    try { localStorage.setItem(MIGRATED_KEY, 'true'); } catch {}
  }

  let drafts: DraftMap = {};
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DraftMap;
      if (parsed && typeof parsed === 'object') {
        for (const id of Object.keys(parsed)) {
          if (scripts.some(s => s.data_id === id)) drafts[id] = parsed[id];
        }
      }
    }
  } catch {}

  const storedActive = (() => { try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; } })();
  const activeId = storedActive && scripts.some(s => s.data_id === storedActive)
    ? storedActive
    : scripts[0]?.data_id ?? null;

  return { scripts, drafts, activeId };
}

function getBridge(): Bridge | null {
  if (typeof window === 'undefined') return null;
  return window.__opsetteBridge ?? null;
}

export interface SaveAllResult {
  ok: boolean;
  savedCount: number;
  errors: Error[];
}

export function useScripts() {
  const bridge = useMemo(getBridge, []);

  const initial = useMemo(() => {
    if (bridge) {
      const fromBridge = hydrateFromBridge(bridge);
      let drafts: DraftMap = {};
      try {
        const raw = localStorage.getItem(DRAFTS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DraftMap;
          if (parsed && typeof parsed === 'object') {
            for (const id of Object.keys(parsed)) {
              if (fromBridge.scripts.some(s => s.data_id === id)) drafts[id] = parsed[id];
            }
          }
        }
      } catch {}
      return { ...fromBridge, drafts };
    }
    return loadFromLocalStorage();
  }, [bridge]);

  const [scripts, setScripts] = useState<SavedScript[]>(initial.scripts);
  const [drafts, setDrafts] = useState<DraftMap>(initial.drafts);
  const [activeId, setActiveId] = useState<string | null>(initial.activeId);

  useEffect(() => {
    if (bridge) return;
    try { localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts)); } catch {}
  }, [scripts, bridge]);

  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  useEffect(() => {
    const handle = window.setTimeout(() => {
      try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(draftsRef.current)); } catch {}
    }, 250);
    return () => window.clearTimeout(handle);
  }, [drafts]);

  useEffect(() => {
    if (bridge) return;
    try {
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {}
  }, [activeId, bridge]);

  const persistedActive = useMemo(
    () => scripts.find(s => s.data_id === activeId) ?? null,
    [scripts, activeId]
  );

  const activeScript = persistedActive;

  const data: ScriptData = useMemo(() => {
    if (!activeId) return DEFAULT_SCRIPT_DATA;
    if (drafts[activeId]) return drafts[activeId];
    return persistedActive?.script ?? DEFAULT_SCRIPT_DATA;
  }, [activeId, drafts, persistedActive]);

  const dirtyIds = useMemo(() => {
    const set = new Set<string>();
    for (const id of Object.keys(drafts)) {
      const persisted = scripts.find(s => s.data_id === id);
      if (persisted && !scriptsEqual(persisted.script, drafts[id])) set.add(id);
    }
    return set;
  }, [drafts, scripts]);

  const isDirty = dirtyIds.size > 0;
  const activeDirty = activeId ? dirtyIds.has(activeId) : false;

  const mutateDraft = useCallback((fn: (s: ScriptData) => ScriptData) => {
    if (!activeId) return;
    setDrafts(prev => {
      const current = prev[activeId] ?? scripts.find(s => s.data_id === activeId)?.script ?? DEFAULT_SCRIPT_DATA;
      return { ...prev, [activeId]: fn(current) };
    });
  }, [activeId, scripts]);

  const updateSection = useCallback(<K extends keyof ScriptData>(
    section: K,
    value: ScriptData[K]
  ) => {
    mutateDraft(s => ({ ...s, [section]: value }));
  }, [mutateDraft]);

  const updateField = useCallback(<K extends keyof ScriptData>(
    section: K,
    field: string,
    value: string
  ) => {
    mutateDraft(s => ({
      ...s,
      [section]: { ...(s[section] as any), [field]: value },
    }));
  }, [mutateDraft]);

  const replaceAll = useCallback((next: ScriptData) => {
    mutateDraft(() => next);
  }, [mutateDraft]);

  const clearActive = useCallback(() => {
    mutateDraft(() => DEFAULT_SCRIPT_DATA);
  }, [mutateDraft]);

  const discardDraft = useCallback((id?: string) => {
    const target = id ?? activeId;
    if (!target) return;
    setDrafts(prev => {
      if (!(target in prev)) return prev;
      const next = { ...prev };
      delete next[target];
      return next;
    });
  }, [activeId]);

  const scriptsRef = useRef(scripts);
  scriptsRef.current = scripts;

  const saveAll = useCallback(async (): Promise<SaveAllResult> => {
    const currentDrafts = draftsRef.current;
    const currentScripts = scriptsRef.current;
    const dirtyEntries: Array<{ id: string; draft: ScriptData; script: SavedScript }> = [];
    for (const id of Object.keys(currentDrafts)) {
      const persisted = currentScripts.find(s => s.data_id === id);
      if (persisted && !scriptsEqual(persisted.script, currentDrafts[id])) {
        dirtyEntries.push({ id, draft: currentDrafts[id], script: persisted });
      }
    }

    if (dirtyEntries.length === 0) {
      return { ok: true, savedCount: 0, errors: [] };
    }

    const ts = nowIso();
    const commitLocal = () => {
      setScripts(prev => prev.map(s => {
        const hit = dirtyEntries.find(e => e.id === s.data_id);
        return hit ? { ...s, script: hit.draft, updatedAt: ts } : s;
      }));
      setDrafts(prev => {
        const next = { ...prev };
        for (const e of dirtyEntries) delete next[e.id];
        return next;
      });
    };

    if (!bridge) {
      commitLocal();
      return { ok: true, savedCount: dirtyEntries.length, errors: [] };
    }

    const results = await Promise.allSettled(dirtyEntries.map(e => {
      const value: SavedScript = { ...e.script, script: e.draft, updatedAt: ts };
      return bridge.save(e.id, toWire(value));
    }));

    const errors: Error[] = [];
    const succeeded = new Set<string>();
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        succeeded.add(dirtyEntries[i].id);
      } else {
        errors.push(r.reason instanceof Error ? r.reason : new Error(String(r.reason)));
      }
    });

    if (succeeded.size > 0) {
      setScripts(prev => prev.map(s => {
        const hit = dirtyEntries.find(e => e.id === s.data_id && succeeded.has(e.id));
        return hit ? { ...s, script: hit.draft, updatedAt: ts } : s;
      }));
      setDrafts(prev => {
        const next = { ...prev };
        for (const id of succeeded) delete next[id];
        return next;
      });
    }

    return { ok: errors.length === 0, savedCount: succeeded.size, errors };
  }, [bridge]);

  const createScript = useCallback((name: string, script?: ScriptData): string => {
    const trimmed = name.trim() || 'Untitled Script';
    const next = makeScript(trimmed, script ?? DEFAULT_SCRIPT_DATA);
    setScripts(prev => [...prev, next]);
    setActiveId(next.data_id);
    if (bridge) {
      bridge.save(next.data_id, toWire(next)).catch(() => {});
    }
    return next.data_id;
  }, [bridge]);

  const openScript = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const renameScript = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    let updated: SavedScript | undefined;
    setScripts(prev => prev.map(s => {
      if (s.data_id !== id) return s;
      updated = { ...s, name: trimmed, updatedAt: nowIso() };
      return updated;
    }));
    if (bridge && updated) {
      bridge.save(id, toWire(updated)).catch(() => {});
    }
  }, [bridge]);

  const duplicateScript = useCallback((id: string): string | null => {
    const src = scripts.find(s => s.data_id === id);
    if (!src) return null;
    const sourceScript = drafts[id] ?? src.script;
    const copy = makeScript(`${src.name} (copy)`, sourceScript);
    setScripts(prev => [...prev, copy]);
    setActiveId(copy.data_id);
    if (bridge) {
      bridge.save(copy.data_id, toWire(copy)).catch(() => {});
    }
    return copy.data_id;
  }, [scripts, drafts, bridge]);

  const saveAs = useCallback((name: string): string | null => {
    if (!activeId) return null;
    const current = drafts[activeId] ?? persistedActive?.script ?? DEFAULT_SCRIPT_DATA;
    const copy = makeScript(name.trim() || 'Untitled Script', current);
    setScripts(prev => [...prev, copy]);
    setDrafts(prev => {
      if (!activeId || !(activeId in prev)) return prev;
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
    setActiveId(copy.data_id);
    if (bridge) {
      bridge.save(copy.data_id, toWire(copy)).catch(() => {});
    }
    return copy.data_id;
  }, [activeId, drafts, persistedActive, bridge]);

  const deleteScript = useCallback((id: string) => {
    setScripts(prev => {
      const remaining = prev.filter(s => s.data_id !== id);
      if (id === activeId) {
        setActiveId(remaining[0]?.data_id ?? null);
      }
      return remaining;
    });
    setDrafts(prev => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (bridge) {
      bridge.delete(id).catch(() => {
        // Optimistic UI already advanced; errors are logged by the bridge timeout handler.
      });
    }
  }, [activeId, bridge]);

  return {
    scripts,
    activeId,
    activeScript,
    data,
    isDirty,
    activeDirty,
    dirtyIds,
    bridgeActive: bridge !== null,
    updateField,
    updateSection,
    replaceAll,
    clearActive,
    saveAll,
    discardDraft,
    createScript,
    openScript,
    renameScript,
    duplicateScript,
    saveAs,
    deleteScript,
  };
}
