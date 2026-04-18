import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ScriptData, DEFAULT_SCRIPT_DATA, SavedScript } from '../types';

const SCRIPTS_KEY = 'script-builder.scripts.v1';
const DRAFTS_KEY = 'script-builder.drafts.v1';
const ACTIVE_KEY = 'script-builder.activeId.v1';
const LEGACY_KEY = 'cold-call-script-data';

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

function loadInitial(): { scripts: SavedScript[]; drafts: DraftMap; activeId: string | null } {
  let scripts: SavedScript[] = [];

  try {
    const raw = localStorage.getItem(SCRIPTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedScript[];
      if (Array.isArray(parsed)) scripts = parsed;
    }
  } catch {}

  if (scripts.length === 0) {
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

export function useScripts() {
  const initial = useMemo(loadInitial, []);
  const [scripts, setScripts] = useState<SavedScript[]>(initial.scripts);
  const [drafts, setDrafts] = useState<DraftMap>(initial.drafts);
  const [activeId, setActiveId] = useState<string | null>(initial.activeId);

  useEffect(() => {
    try { localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts)); } catch {}
  }, [scripts]);

  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  useEffect(() => {
    const handle = window.setTimeout(() => {
      try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(draftsRef.current)); } catch {}
    }, 250);
    return () => window.clearTimeout(handle);
  }, [drafts]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {}
  }, [activeId]);

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

  const isDirty = activeId ? dirtyIds.has(activeId) : false;

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

  const saveActive = useCallback((): boolean => {
    if (!activeId) return false;
    const draft = drafts[activeId];
    if (!draft) return false;
    setScripts(prev => prev.map(s =>
      s.data_id === activeId
        ? { ...s, script: draft, updatedAt: nowIso() }
        : s
    ));
    setDrafts(prev => {
      if (!(activeId in prev)) return prev;
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
    return true;
  }, [activeId, drafts]);

  const createScript = useCallback((name: string, script?: ScriptData): string => {
    const trimmed = name.trim() || 'Untitled Script';
    const next = makeScript(trimmed, script ?? DEFAULT_SCRIPT_DATA);
    setScripts(prev => [...prev, next]);
    setActiveId(next.data_id);
    return next.data_id;
  }, []);

  const openScript = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const renameScript = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setScripts(prev => prev.map(s =>
      s.data_id === id ? { ...s, name: trimmed, updatedAt: nowIso() } : s
    ));
  }, []);

  const duplicateScript = useCallback((id: string): string | null => {
    const src = scripts.find(s => s.data_id === id);
    if (!src) return null;
    const sourceScript = drafts[id] ?? src.script;
    const copy = makeScript(`${src.name} (copy)`, sourceScript);
    setScripts(prev => [...prev, copy]);
    setActiveId(copy.data_id);
    return copy.data_id;
  }, [scripts, drafts]);

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
    return copy.data_id;
  }, [activeId, drafts, persistedActive]);

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
  }, [activeId]);

  return {
    scripts,
    activeId,
    activeScript,
    data,
    isDirty,
    dirtyIds,
    updateField,
    updateSection,
    replaceAll,
    clearActive,
    saveActive,
    discardDraft,
    createScript,
    openScript,
    renameScript,
    duplicateScript,
    saveAs,
    deleteScript,
  };
}
