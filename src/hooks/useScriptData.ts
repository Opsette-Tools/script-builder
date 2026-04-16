import { useState, useEffect, useCallback } from 'react';
import { ScriptData, DEFAULT_SCRIPT_DATA } from '../types';

const STORAGE_KEY = 'cold-call-script-data';

export function useScriptData() {
  const [data, setData] = useState<ScriptData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SCRIPT_DATA, ...parsed };
      }
    } catch {}
    return DEFAULT_SCRIPT_DATA;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  const updateSection = useCallback(<K extends keyof ScriptData>(
    section: K,
    value: ScriptData[K]
  ) => {
    setData(prev => ({ ...prev, [section]: value }));
  }, []);

  const updateField = useCallback(<K extends keyof ScriptData>(
    section: K,
    field: string,
    value: string
  ) => {
    setData(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), [field]: value },
    }));
  }, []);

  const clearAll = useCallback(() => {
    setData(DEFAULT_SCRIPT_DATA);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const replaceAll = useCallback((next: ScriptData) => {
    setData(next);
  }, []);

  return { data, updateSection, updateField, clearAll, replaceAll };
}
