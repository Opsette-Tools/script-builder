import {
  ScriptData,
  ScriptStyle,
  BuiltinSectionKey,
  SectionId,
  DEFAULT_SECTION_ORDER,
  CustomSection,
} from '../types';

export interface SectionListEntry {
  id: SectionId;
  isCustom: boolean;
  builtinKey: BuiltinSectionKey | null;
  custom: CustomSection | null;
  label: string;
  number: number;
  hidden: boolean;
}

const BUILTIN_LABELS: Record<BuiltinSectionKey, string> = {
  opener: 'Introduce Yourself',
  permissionAsk: 'Ask Permission to Continue',
  qualifyingQuestion: 'Discovery Question',
  reasonForCall: 'State the Reason for Your Call',
  problem: 'Name the Problem They Likely Have',
  agitate: 'Describe the Cost of Doing Nothing',
  valueProp: 'Share What You Offer',
  cta: 'Ask for the Next Step',
  objections: 'Handle Objections',
  close: 'End the Call',
};

export function builtinLabel(key: BuiltinSectionKey, style: ScriptStyle): string {
  if (key === 'qualifyingQuestion' && style === 'question-led') return 'Open With a Question';
  return BUILTIN_LABELS[key];
}

function isStyleCompatible(key: BuiltinSectionKey, style: ScriptStyle): boolean {
  if (key === 'permissionAsk' && style !== 'permission') return false;
  return true;
}

function customById(custom: CustomSection[]): Map<string, CustomSection> {
  const m = new Map<string, CustomSection>();
  for (const c of custom) m.set(c.id, c);
  return m;
}

export function reconcileSectionOrder(data: ScriptData): SectionId[] {
  const order = Array.isArray(data.sectionOrder) ? data.sectionOrder.slice() : [];
  const seen = new Set<string>();
  const result: SectionId[] = [];

  for (const id of order) {
    if (typeof id !== 'string') continue;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }

  for (const key of DEFAULT_SECTION_ORDER) {
    if (!seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }

  const customMap = customById(data.customSections || []);
  for (const c of data.customSections || []) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      result.push(c.id);
    }
  }

  return result.filter(id => {
    if (DEFAULT_SECTION_ORDER.includes(id as BuiltinSectionKey)) return true;
    return customMap.has(id);
  });
}

export function getSectionList(data: ScriptData): SectionListEntry[] {
  const order = reconcileSectionOrder(data);
  const hidden = new Set(data.hiddenSections || []);
  const customMap = customById(data.customSections || []);
  const style = data.scriptStyle;

  const entries: SectionListEntry[] = [];
  let visibleCount = 0;

  for (const id of order) {
    const isBuiltin = DEFAULT_SECTION_ORDER.includes(id as BuiltinSectionKey);

    if (isBuiltin) {
      const key = id as BuiltinSectionKey;
      if (!isStyleCompatible(key, style)) continue;

      const isHidden = hidden.has(id);
      let number = 0;
      if (!isHidden) {
        visibleCount += 1;
        number = visibleCount;
      }

      entries.push({
        id,
        isCustom: false,
        builtinKey: key,
        custom: null,
        label: builtinLabel(key, style),
        number,
        hidden: isHidden,
      });
      continue;
    }

    const custom = customMap.get(id);
    if (!custom) continue;
    const isHidden = hidden.has(id);
    let number = 0;
    if (!isHidden) {
      visibleCount += 1;
      number = visibleCount;
    }
    entries.push({
      id,
      isCustom: true,
      builtinKey: null,
      custom,
      label: custom.label || 'Custom Section',
      number,
      hidden: isHidden,
    });
  }

  return entries;
}

export function visibleSections(data: ScriptData): SectionListEntry[] {
  return getSectionList(data).filter(e => !e.hidden);
}

export function sectionNumber(data: ScriptData, id: SectionId): number | undefined {
  const entry = getSectionList(data).find(e => e.id === id);
  if (!entry || entry.hidden) return undefined;
  return entry.number;
}
