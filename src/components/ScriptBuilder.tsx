import React, { useMemo, useState } from 'react';
import {
  Input,
  Select,
  Space,
  Typography,
  Button,
  Tag,
  Popconfirm,
  Tooltip,
  Dropdown,
  Modal,
  Form,
  Empty,
} from 'antd';
import {
  DeleteOutlined,
  HolderOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  DownOutlined,
  UpOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ScriptData,
  SectionId,
  CustomSection,
  CustomSectionKind,
  BranchEntry,
  GREETING_STYLES,
  PERMISSION_PRESETS,
  REASON_PRESETS,
  PROBLEM_PRESETS,
  AGITATE_PRESETS,
  VALUE_PROP_PRESETS,
  QUESTION_PRESETS,
  CTA_PRESETS,
  CLOSE_YES_PRESETS,
  CLOSE_NO_PRESETS,
} from '../types';
import { getSectionList, SectionListEntry, SectionShape, SHAPE_LABEL } from '../lib/sections';
import ObjectionCards from './ObjectionCards';

const SHAPE_COLOR: Record<SectionShape, string> = {
  single: 'default',
  multi: 'cyan',
  branches: 'purple',
};

const SubGroup: React.FC<{ label: string; children: React.ReactNode; first?: boolean }> = ({ label, children, first }) => (
  <div style={{ marginTop: first ? 0 : 14, paddingTop: first ? 0 : 14, borderTop: first ? 'none' : '1.5px solid rgba(0,0,0,0.28)' }}>
    <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.85, display: 'block', marginBottom: 6 }}>
      {label}
    </Text>
    {children}
  </div>
);

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  data: ScriptData;
  updateField: (section: keyof ScriptData, field: string, value: string) => void;
  updateSection: <K extends keyof ScriptData>(section: K, value: ScriptData[K]) => void;
  onClearAll: () => void;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

const QuickFill: React.FC<{ presets: string[]; onSelect: (v: string) => void }> = ({ presets, onSelect }) => (
  <div style={{ marginBottom: 8 }}>
    <Text type="secondary" style={{ fontSize: 11, marginRight: 6 }}>Quick fill:</Text>
    {presets.map((p, i) => (
      <Tag
        key={i}
        color="blue"
        style={{ cursor: 'pointer', marginBottom: 4 }}
        onClick={() => onSelect(p)}
      >
        {p.length > 50 ? p.slice(0, 47) + '…' : p}
      </Tag>
    ))}
  </div>
);

interface EditorProps {
  data: ScriptData;
  updateField: Props['updateField'];
  updateSection: Props['updateSection'];
}

function renderBuiltinEditor(
  key: NonNullable<SectionListEntry['builtinKey']>,
  { data, updateField, updateSection }: EditorProps
): React.ReactNode {
  const u = (section: keyof ScriptData, field: string) => (value: string) =>
    updateField(section, field, value);

  switch (key) {
    case 'opener': {
      const isReferral = data.scriptStyle === 'referral';
      return (
        <>
          <SubGroup label="Identity" first>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Your name</Text>
                <Input
                  placeholder="John Smith"
                  value={data.opener.yourName}
                  onChange={e => updateField('opener', 'yourName', e.target.value)}
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Your company</Text>
                <Input
                  placeholder="Acme Solutions"
                  value={data.opener.businessName}
                  onChange={e => updateField('opener', 'businessName', e.target.value)}
                />
              </div>
              {isReferral && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Who referred you?</Text>
                  <Input
                    placeholder='e.g. "Mike Johnson" or "Sarah at ABC Plumbing"'
                    value={data.opener.referrerName}
                    onChange={e => updateField('opener', 'referrerName', e.target.value)}
                  />
                </div>
              )}
            </Space>
          </SubGroup>
          <SubGroup label="Tone">
            <Text type="secondary" style={{ fontSize: 12 }}>Greeting tone</Text>
            <Select
              style={{ width: '100%' }}
              value={data.opener.greetingStyle}
              onChange={v => updateField('opener', 'greetingStyle', v)}
              options={GREETING_STYLES}
            />
          </SubGroup>
        </>
      );
    }
    case 'permissionAsk':
      return (
        <>
          <QuickFill presets={PERMISSION_PRESETS} onSelect={u('permissionAsk', 'line')} />
          <TextArea
            rows={2}
            placeholder='Ask for a moment of their time, e.g. "Did I catch you at a bad time?"'
            value={data.permissionAsk.line}
            onChange={e => updateField('permissionAsk', 'line', e.target.value)}
          />
        </>
      );
    case 'qualifyingQuestion': {
      const extras = data.qualifyingQuestion.extra ?? [];
      const setExtras = (next: string[]) => {
        updateSection('qualifyingQuestion', { ...data.qualifyingQuestion, extra: next });
      };
      return (
        <>
          <SubGroup label="Lead question" first>
            <QuickFill presets={QUESTION_PRESETS} onSelect={u('qualifyingQuestion', 'primary')} />
            <TextArea
              rows={2}
              placeholder='Your main discovery question, e.g. "How are you currently handling...?"'
              value={data.qualifyingQuestion.primary}
              onChange={e => updateField('qualifyingQuestion', 'primary', e.target.value)}
            />
          </SubGroup>
          <SubGroup label={extras.length === 0 ? 'Follow-ups (optional)' : `Follow-ups (${extras.length})`}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {extras.map((q, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Follow-up #{idx + 1}</Text>
                    <Button
                      size="small"
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => setExtras(extras.filter((_, i) => i !== idx))}
                    />
                  </div>
                  <TextArea
                    rows={2}
                    placeholder='Layer in another question to dig deeper.'
                    value={q}
                    onChange={e => setExtras(extras.map((v, i) => (i === idx ? e.target.value : v)))}
                  />
                </div>
              ))}
              <Button
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setExtras([...extras, ''])}
                block
              >
                Add follow-up question
              </Button>
            </Space>
          </SubGroup>
        </>
      );
    }
    case 'reasonForCall':
      return (
        <>
          <QuickFill presets={REASON_PRESETS} onSelect={u('reasonForCall', 'why')} />
          <TextArea
            rows={3}
            placeholder="In one sentence, explain why you're calling them specifically."
            value={data.reasonForCall.why}
            onChange={e => updateField('reasonForCall', 'why', e.target.value)}
          />
        </>
      );
    case 'problem':
      return (
        <>
          <QuickFill presets={PROBLEM_PRESETS} onSelect={u('problem', 'mainPain')} />
          <TextArea
            rows={3}
            placeholder="Describe the main pain point your prospect is probably facing."
            value={data.problem.mainPain}
            onChange={e => updateField('problem', 'mainPain', e.target.value)}
          />
        </>
      );
    case 'agitate':
      return (
        <>
          <QuickFill presets={AGITATE_PRESETS} onSelect={u('agitate', 'consequence')} />
          <TextArea
            rows={3}
            placeholder="What does this problem cost them in time, money, or missed opportunities?"
            value={data.agitate.consequence}
            onChange={e => updateField('agitate', 'consequence', e.target.value)}
          />
        </>
      );
    case 'valueProp':
      return (
        <>
          <QuickFill presets={VALUE_PROP_PRESETS} onSelect={u('valueProp', 'pitch')} />
          <TextArea
            rows={3}
            placeholder="In 2–3 sentences: what you do, how it helps, and why you're different."
            value={data.valueProp.pitch}
            onChange={e => updateField('valueProp', 'pitch', e.target.value)}
          />
        </>
      );
    case 'cta':
      return (
        <>
          <QuickFill presets={CTA_PRESETS} onSelect={u('cta', 'line')} />
          <TextArea
            rows={2}
            placeholder="What's the specific next step you want them to take?"
            value={data.cta.line}
            onChange={e => updateField('cta', 'line', e.target.value)}
          />
        </>
      );
    case 'objections':
      return (
        <ObjectionCards
          objections={data.objections}
          onChange={(objections) => updateSection('objections', objections)}
        />
      );
    case 'close':
      return (
        <>
          <SubGroup label="If they say yes" first>
            <QuickFill presets={CLOSE_YES_PRESETS} onSelect={u('close', 'positive')} />
            <TextArea
              rows={2}
              placeholder='How you confirm the next step once they agree.'
              value={data.close.positive}
              onChange={e => updateField('close', 'positive', e.target.value)}
            />
          </SubGroup>
          <SubGroup label="If they say no">
            <QuickFill presets={CLOSE_NO_PRESETS} onSelect={u('close', 'neutral')} />
            <TextArea
              rows={2}
              placeholder='How you end the call gracefully if they pass.'
              value={data.close.neutral}
              onChange={e => updateField('close', 'neutral', e.target.value)}
            />
          </SubGroup>
        </>
      );
  }
}

const CustomSectionEditor: React.FC<{
  section: CustomSection;
  onChange: (next: CustomSection) => void;
}> = ({ section, onChange }) => {
  if (section.kind === 'free-text') {
    return (
      <TextArea
        rows={4}
        placeholder='Write what you want to say here. Use this for an anchor observation, a soft transition, an exit line — anything that doesn’t fit the standard sections.'
        value={section.body}
        onChange={e => onChange({ ...section, body: e.target.value })}
      />
    );
  }
  const branches = section.branches;
  const setBranches = (next: BranchEntry[]) => onChange({ ...section, branches: next });
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      <Text type="secondary" style={{ fontSize: 12 }}>
        Each branch is an "if they say / do X, then I say Y" pair. Use this for cost questions, language barriers, "we're fine" responses — anything conditional.
      </Text>
      {branches.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No branches yet"
          style={{ margin: '8px 0' }}
        />
      )}
      {branches.map((b, idx) => (
        <div
          key={b.id}
          style={{
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 6,
            padding: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text strong style={{ fontSize: 12 }}>Branch #{idx + 1}</Text>
            <Button
              size="small"
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => setBranches(branches.filter(x => x.id !== b.id))}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>If they…</Text>
          <Input
            placeholder='e.g. "ask what it costs"'
            value={b.trigger}
            onChange={e => setBranches(branches.map(x => x.id === b.id ? { ...x, trigger: e.target.value } : x))}
            style={{ marginBottom: 6 }}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>You say…</Text>
          <TextArea
            rows={2}
            placeholder='Your response.'
            value={b.response}
            onChange={e => setBranches(branches.map(x => x.id === b.id ? { ...x, response: e.target.value } : x))}
          />
        </div>
      ))}
      <Button
        size="small"
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => setBranches([...branches, { id: newId(), trigger: '', response: '' }])}
      >
        Add branch
      </Button>
    </Space>
  );
};

interface PanelProps {
  entry: SectionListEntry;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleHide: () => void;
  onRenameCustom?: () => void;
  onDeleteCustom?: () => void;
  children: React.ReactNode;
}

const SortablePanel: React.FC<PanelProps> = ({
  entry,
  expanded,
  onToggleExpand,
  onToggleHide,
  onRenameCustom,
  onDeleteCustom,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8,
    marginBottom: 8,
    background: 'var(--ant-color-bg-container, #fff)',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={onToggleExpand}
      >
        <span
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: 'grab', color: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center' }}
          aria-label="Drag to reorder section"
          title="Drag to reorder"
        >
          <HolderOutlined />
        </span>
        <Tag color={entry.hidden ? 'default' : 'blue'} style={{ marginInlineEnd: 0, minWidth: 28, textAlign: 'center' }}>
          {entry.hidden ? '—' : entry.number}
        </Tag>
        <Text strong style={{ flex: 1, opacity: entry.hidden ? 0.55 : 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.label}
          </span>
          <Tooltip
            title={
              entry.shape === 'single' ? 'One field — write one line or paragraph.'
                : entry.shape === 'multi' ? 'A few labeled fields grouped together.'
                : 'A list of "if they / you say" branches.'
            }
          >
            <Tag
              color={SHAPE_COLOR[entry.shape]}
              style={{ marginInlineEnd: 0, fontSize: 10, lineHeight: '16px', padding: '0 6px' }}
            >
              {SHAPE_LABEL[entry.shape]}
            </Tag>
          </Tooltip>
          {entry.isCustom && (
            <Tag style={{ marginInlineEnd: 0, fontSize: 10, lineHeight: '16px', padding: '0 6px' }} color="default">
              Custom
            </Tag>
          )}
        </Text>
        {entry.isCustom && onRenameCustom && (
          <Tooltip title="Rename section">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => { e.stopPropagation(); onRenameCustom(); }}
            />
          </Tooltip>
        )}
        {entry.isCustom && onDeleteCustom && (
          <Popconfirm
            title="Delete this custom section?"
            description="The content will be lost."
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            onConfirm={onDeleteCustom}
          >
            <Tooltip title="Delete section">
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        )}
        <Tooltip title={entry.hidden ? 'Show in script' : 'Hide from script'}>
          <Button
            size="small"
            type="text"
            icon={entry.hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={(e) => { e.stopPropagation(); onToggleHide(); }}
          />
        </Tooltip>
        <Button
          size="small"
          type="text"
          icon={expanded ? <UpOutlined /> : <DownOutlined />}
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
        />
      </div>
      {expanded && !entry.hidden && (
        <div style={{ padding: '4px 16px 16px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

const ScriptBuilder: React.FC<Props> = ({ data, updateField, updateSection, onClearAll }) => {
  const sections = useMemo(() => getSectionList(data), [data]);

  const [expanded, setExpanded] = useState<Set<SectionId>>(() => {
    const init = new Set<SectionId>();
    for (const s of sections) {
      if (!s.hidden && (s.builtinKey === 'opener' || s.builtinKey === 'permissionAsk' || s.builtinKey === 'qualifyingQuestion' || s.builtinKey === 'reasonForCall')) {
        init.add(s.id);
      }
    }
    return init;
  });

  const [createKind, setCreateKind] = useState<CustomSectionKind | null>(null);
  const [createLabel, setCreateLabel] = useState('');

  const [renameTarget, setRenameTarget] = useState<CustomSection | null>(null);
  const [renameLabel, setRenameLabel] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const orderIds = sections.map(s => s.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderIds.indexOf(String(active.id));
    const newIndex = orderIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(orderIds, oldIndex, newIndex);
    updateSection('sectionOrder', next);
  };

  const toggleExpand = (id: SectionId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleHide = (id: SectionId) => {
    const hidden = new Set(data.hiddenSections || []);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    updateSection('hiddenSections', Array.from(hidden));
  };

  const submitCreate = () => {
    if (!createKind) return;
    const trimmed = createLabel.trim();
    if (!trimmed) return;
    const id = newId();
    const newSection: CustomSection = {
      id,
      kind: createKind,
      label: trimmed,
      body: '',
      branches: [],
    };
    updateSection('customSections', [...(data.customSections || []), newSection]);
    updateSection('sectionOrder', [...(data.sectionOrder || []), id]);
    setExpanded(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setCreateKind(null);
    setCreateLabel('');
  };

  const submitRename = () => {
    if (!renameTarget) return;
    const trimmed = renameLabel.trim();
    if (!trimmed) return;
    updateSection(
      'customSections',
      (data.customSections || []).map(c =>
        c.id === renameTarget.id ? { ...c, label: trimmed } : c
      )
    );
    setRenameTarget(null);
    setRenameLabel('');
  };

  const updateCustomSection = (next: CustomSection) => {
    updateSection(
      'customSections',
      (data.customSections || []).map(c => (c.id === next.id ? next : c))
    );
  };

  const deleteCustomSection = (id: string) => {
    updateSection(
      'customSections',
      (data.customSections || []).filter(c => c.id !== id)
    );
    updateSection(
      'sectionOrder',
      (data.sectionOrder || []).filter(s => s !== id)
    );
    updateSection(
      'hiddenSections',
      (data.hiddenSections || []).filter(s => s !== id)
    );
  };

  const addMenuItems = [
    {
      key: 'free-text',
      icon: <Tag color={SHAPE_COLOR.single} style={{ marginInlineEnd: 0, fontSize: 10, lineHeight: '16px', padding: '0 6px' }}>{SHAPE_LABEL.single}</Tag>,
      label: (
        <span>
          <span style={{ fontWeight: 500 }}>Single</span>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>One field — what you say</Text>
        </span>
      ),
      onClick: () => { setCreateKind('free-text'); setCreateLabel(''); },
    },
    {
      key: 'branch',
      icon: <Tag color={SHAPE_COLOR.branches} style={{ marginInlineEnd: 0, fontSize: 10, lineHeight: '16px', padding: '0 6px' }}>{SHAPE_LABEL.branches}</Tag>,
      label: (
        <span>
          <span style={{ fontWeight: 500 }}>Branches</span>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>List of "if they / you say" pairs</Text>
        </span>
      ),
      onClick: () => { setCreateKind('branch'); setCreateLabel(''); },
    },
  ];

  const hiddenEntries = sections.filter(s => s.hidden);

  return (
    <>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Drag sections to reorder. Numbers update automatically.
        </Text>
        <Dropdown menu={{ items: addMenuItems }} trigger={['click']}>
          <Button size="small" icon={<PlusOutlined />}>
            Add section
          </Button>
        </Dropdown>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
          {sections.map(entry => (
            <SortablePanel
              key={entry.id}
              entry={entry}
              expanded={expanded.has(entry.id)}
              onToggleExpand={() => toggleExpand(entry.id)}
              onToggleHide={() => toggleHide(entry.id)}
              onRenameCustom={
                entry.isCustom
                  ? () => {
                      setRenameTarget(entry.custom!);
                      setRenameLabel(entry.custom!.label);
                    }
                  : undefined
              }
              onDeleteCustom={entry.isCustom ? () => deleteCustomSection(entry.id) : undefined}
            >
              {entry.isCustom && entry.custom ? (
                <CustomSectionEditor
                  section={entry.custom}
                  onChange={updateCustomSection}
                />
              ) : entry.builtinKey ? (
                renderBuiltinEditor(entry.builtinKey, { data, updateField, updateSection })
              ) : null}
            </SortablePanel>
          ))}
        </SortableContext>
      </DndContext>

      {hiddenEntries.length > 0 && (
        <div className="no-print" style={{ marginTop: 12, marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
            Hidden ({hiddenEntries.length}):
          </Text>
          {hiddenEntries.map(e => (
            <Tag
              key={e.id}
              icon={<EyeInvisibleOutlined />}
              style={{ cursor: 'pointer', marginBottom: 4 }}
              onClick={() => toggleHide(e.id)}
            >
              {e.label}
            </Tag>
          ))}
        </div>
      )}

      {/* After-call notes — pinned, not part of the spoken script */}
      <div
        style={{
          border: '1px dashed rgba(0,0,0,0.15)',
          borderRadius: 8,
          padding: '12px 16px',
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        <Text strong>📝 After the Call (Internal)</Text>
        <Text type="secondary" italic style={{ display: 'block', fontSize: 11, marginBottom: 8 }}>
          Internal notes — not part of the spoken script, not numbered, not draggable.
        </Text>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>If they said yes — what do you do next?</Text>
            <TextArea
              rows={2}
              placeholder='e.g. "Send calendar invite, prep proposal, update CRM"'
              value={data.afterCall.ifYes}
              onChange={e => updateField('afterCall', 'ifYes', e.target.value)}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>If they said no — what do you do next?</Text>
            <TextArea
              rows={2}
              placeholder='e.g. "Add to 90-day follow-up list, send nurture email"'
              value={data.afterCall.ifNo}
              onChange={e => updateField('afterCall', 'ifNo', e.target.value)}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Notes / follow-up actions</Text>
            <TextArea
              rows={3}
              placeholder='Any other internal reminders or next steps...'
              value={data.afterCall.notes}
              onChange={e => updateField('afterCall', 'notes', e.target.value)}
            />
          </div>
        </Space>
      </div>

      <div className="no-print" style={{ textAlign: 'right', marginBottom: 16 }}>
        <Popconfirm
          title="Clear everything?"
          description="This will wipe all sections. Can't be undone."
          onConfirm={onClearAll}
          okText="Clear"
          cancelText="Cancel"
        >
          <Button size="small" type="text" danger icon={<DeleteOutlined />}>
            Clear all fields
          </Button>
        </Popconfirm>
      </div>

      <Modal
        title={createKind === 'branch' ? 'New Branches section' : 'New Single section'}
        open={createKind !== null}
        onCancel={() => { setCreateKind(null); setCreateLabel(''); }}
        onOk={submitCreate}
        okText="Add section"
        okButtonProps={{ disabled: !createLabel.trim() }}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="Section name" help={
            createKind === 'branch'
              ? 'e.g. "Off-ramp branches", "Pricing / rushed / language"'
              : 'e.g. "Anchor observation", "Soft transition", "Exit line"'
          }>
            <Input
              autoFocus
              value={createLabel}
              onChange={e => setCreateLabel(e.target.value)}
              onPressEnter={submitCreate}
              placeholder={createKind === 'branch' ? 'Off-ramp branches' : 'Anchor observation'}
              maxLength={60}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Rename section"
        open={renameTarget !== null}
        onCancel={() => { setRenameTarget(null); setRenameLabel(''); }}
        onOk={submitRename}
        okText="Rename"
        okButtonProps={{ disabled: !renameLabel.trim() }}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="Section name">
            <Input
              autoFocus
              value={renameLabel}
              onChange={e => setRenameLabel(e.target.value)}
              onPressEnter={submitRename}
              maxLength={60}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ScriptBuilder;
