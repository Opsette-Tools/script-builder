import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScriptData, DEFAULT_SCRIPT_DATA, SavedScript } from '../types';

const SCRIPTS_KEY = 'script-builder.scripts.v1';
const ACTIVE_KEY = 'script-builder.activeId.v1';
const LEGACY_KEY = 'cold-call-script-data';

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

function loadInitial(): { scripts: SavedScript[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(SCRIPTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedScript[];
      if (Array.isArray(parsed)) {
        const activeId = localStorage.getItem(ACTIVE_KEY);
        const validActive = activeId && parsed.some(s => s.data_id === activeId)
          ? activeId
          : parsed[0]?.data_id ?? null;
        return { scripts: parsed, activeId: validActive };
      }
    }
  } catch {}

  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const migrated = makeScript('My Script', { ...DEFAULT_SCRIPT_DATA, ...parsed });
      localStorage.removeItem(LEGACY_KEY);
      return { scripts: [migrated], activeId: migrated.data_id };
    }
  } catch {}

  return { scripts: [], activeId: null };
}

export function useScripts() {
  const initial = useMemo(loadInitial, []);
  const [scripts, setScripts] = useState<SavedScript[]>(initial.scripts);
  const [activeId, setActiveId] = useState<string | null>(initial.activeId);

  useEffect(() => {
    try {
      localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
    } catch {}
  }, [scripts]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {}
  }, [activeId]);

  const activeScript = useMemo(
    () => scripts.find(s => s.data_id === activeId) ?? null,
    [scripts, activeId]
  );

  const data: ScriptData = activeScript?.script ?? DEFAULT_SCRIPT_DATA;

  const mutateActive = useCallback((fn: (s: ScriptData) => ScriptData) => {
    setScripts(prev => prev.map(s =>
      s.data_id === activeId
        ? { ...s, script: fn(s.script), updatedAt: nowIso() }
        : s
    ));
  }, [activeId]);

  const updateSection = useCallback(<K extends keyof ScriptData>(
    section: K,
    value: ScriptData[K]
  ) => {
    mutateActive(s => ({ ...s, [section]: value }));
  }, [mutateActive]);

  const updateField = useCallback(<K extends keyof ScriptData>(
    section: K,
    field: string,
    value: string
  ) => {
    mutateActive(s => ({
      ...s,
      [section]: { ...(s[section] as any), [field]: value },
    }));
  }, [mutateActive]);

  const replaceAll = useCallback((next: ScriptData) => {
    mutateActive(() => next);
  }, [mutateActive]);

  const clearActive = useCallback(() => {
    mutateActive(() => DEFAULT_SCRIPT_DATA);
  }, [mutateActive]);

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
    const copy = makeScript(`${src.name} (copy)`, src.script);
    setScripts(prev => [...prev, copy]);
    setActiveId(copy.data_id);
    return copy.data_id;
  }, [scripts]);

  const saveAs = useCallback((name: string): string | null => {
    if (!activeScript) return null;
    const copy = makeScript(name.trim() || 'Untitled Script', activeScript.script);
    setScripts(prev => [...prev, copy]);
    setActiveId(copy.data_id);
    return copy.data_id;
  }, [activeScript]);

  const deleteScript = useCallback((id: string) => {
    setScripts(prev => {
      const remaining = prev.filter(s => s.data_id !== id);
      if (id === activeId) {
        setActiveId(remaining[0]?.data_id ?? null);
      }
      return remaining;
    });
  }, [activeId]);

  return {
    scripts,
    activeId,
    activeScript,
    data,
    updateField,
    updateSection,
    replaceAll,
    clearActive,
    createScript,
    openScript,
    renameScript,
    duplicateScript,
    saveAs,
    deleteScript,
  };
}
