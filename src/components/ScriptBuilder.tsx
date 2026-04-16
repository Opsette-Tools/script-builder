import React from 'react';
import { Collapse, Input, Select, Space, Typography, Button, Tag, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import {
  ScriptData,
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
import ObjectionCards from './ObjectionCards';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  data: ScriptData;
  updateField: (section: keyof ScriptData, field: string, value: string) => void;
  updateSection: <K extends keyof ScriptData>(section: K, value: ScriptData[K]) => void;
  onClearAll: () => void;
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

const ScriptBuilder: React.FC<Props> = ({ data, updateField, updateSection, onClearAll }) => {
  const u = (section: keyof ScriptData, field: string) => (value: string) =>
    updateField(section, field, value);

  const isReferral = data.scriptStyle === 'referral';
  const isQuestionLed = data.scriptStyle === 'question-led';
  const isPermission = data.scriptStyle === 'permission';

  const items = [
    {
      key: 'opener',
      label: '1. Introduce Yourself',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Your name</Text>
            <Input placeholder="John Smith" value={data.opener.yourName} onChange={e => updateField('opener', 'yourName', e.target.value)} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Your company</Text>
            <Input placeholder="Acme Solutions" value={data.opener.businessName} onChange={e => updateField('opener', 'businessName', e.target.value)} />
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
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Greeting tone</Text>
            <Select
              style={{ width: '100%' }}
              value={data.opener.greetingStyle}
              onChange={v => updateField('opener', 'greetingStyle', v)}
              options={GREETING_STYLES}
            />
          </div>
        </Space>
      ),
    },
    ...(isPermission ? [{
      key: 'permissionAsk',
      label: '2. Ask Permission to Continue',
      children: (
        <>
          <QuickFill presets={PERMISSION_PRESETS} onSelect={u('permissionAsk', 'line')} />
          <TextArea
            rows={2}
            placeholder='Ask for a moment of their time, e.g. "Did I catch you at a bad time?"'
            value={data.permissionAsk.line}
            onChange={e => updateField('permissionAsk', 'line', e.target.value)}
          />
        </>
      ),
    }] : []),
    ...(isQuestionLed ? [{
      key: 'qualifyingQuestion',
      label: '2. Open With a Question',
      children: (
        <>
          <QuickFill presets={QUESTION_PRESETS} onSelect={u('qualifyingQuestion', 'primary')} />
          <TextArea
            rows={2}
            placeholder='Ask a question that gets them talking, e.g. "How are you currently handling...?"'
            value={data.qualifyingQuestion.primary}
            onChange={e => updateField('qualifyingQuestion', 'primary', e.target.value)}
          />
        </>
      ),
    }] : []),
    {
      key: 'reasonForCall',
      label: `${isPermission || isQuestionLed ? '3' : '2'}. State the Reason for Your Call`,
      children: (
        <>
          <QuickFill presets={REASON_PRESETS} onSelect={u('reasonForCall', 'why')} />
          <TextArea
            rows={3}
            placeholder="In one sentence, explain why you're calling them specifically."
            value={data.reasonForCall.why}
            onChange={e => updateField('reasonForCall', 'why', e.target.value)}
          />
        </>
      ),
    },
    {
      key: 'problem',
      label: `${isPermission || isQuestionLed ? '4' : '3'}. Name the Problem They Likely Have`,
      children: (
        <>
          <QuickFill presets={PROBLEM_PRESETS} onSelect={u('problem', 'mainPain')} />
          <TextArea
            rows={3}
            placeholder="Describe the main pain point your prospect is probably facing."
            value={data.problem.mainPain}
            onChange={e => updateField('problem', 'mainPain', e.target.value)}
          />
        </>
      ),
    },
    {
      key: 'agitate',
      label: `${isPermission || isQuestionLed ? '5' : '4'}. Describe the Cost of Doing Nothing`,
      children: (
        <>
          <QuickFill presets={AGITATE_PRESETS} onSelect={u('agitate', 'consequence')} />
          <TextArea
            rows={3}
            placeholder="What does this problem cost them in time, money, or missed opportunities?"
            value={data.agitate.consequence}
            onChange={e => updateField('agitate', 'consequence', e.target.value)}
          />
        </>
      ),
    },
    {
      key: 'valueProp',
      label: `${isPermission || isQuestionLed ? '6' : '5'}. Share What You Offer`,
      children: (
        <>
          <QuickFill presets={VALUE_PROP_PRESETS} onSelect={u('valueProp', 'pitch')} />
          <TextArea
            rows={3}
            placeholder="In 2–3 sentences: what you do, how it helps, and why you're different."
            value={data.valueProp.pitch}
            onChange={e => updateField('valueProp', 'pitch', e.target.value)}
          />
        </>
      ),
    },
    ...(!isQuestionLed ? [{
      key: 'qualifyingQuestion',
      label: `${isPermission ? '7' : '6'}. Ask a Discovery Question`,
      children: (
        <>
          <QuickFill presets={QUESTION_PRESETS} onSelect={u('qualifyingQuestion', 'primary')} />
          <TextArea
            rows={2}
            placeholder='Ask an open question to get them talking, e.g. "How are you currently handling...?"'
            value={data.qualifyingQuestion.primary}
            onChange={e => updateField('qualifyingQuestion', 'primary', e.target.value)}
          />
        </>
      ),
    }] : []),
    {
      key: 'cta',
      label: `${isPermission ? '8' : isQuestionLed ? '7' : '7'}. Ask for the Next Step`,
      children: (
        <>
          <QuickFill presets={CTA_PRESETS} onSelect={u('cta', 'line')} />
          <TextArea
            rows={2}
            placeholder="What's the specific next step you want them to take?"
            value={data.cta.line}
            onChange={e => updateField('cta', 'line', e.target.value)}
          />
        </>
      ),
    },
    {
      key: 'objections',
      label: `${isPermission ? '9' : '8'}. Handle Objections`,
      children: (
        <ObjectionCards
          objections={data.objections}
          onChange={(objections) => updateSection('objections', objections)}
        />
      ),
    },
    {
      key: 'close',
      label: `${isPermission ? '10' : '9'}. End the Call`,
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>If they say yes</Text>
            <QuickFill presets={CLOSE_YES_PRESETS} onSelect={u('close', 'positive')} />
            <TextArea
              rows={2}
              placeholder='How you confirm the next step once they agree.'
              value={data.close.positive}
              onChange={e => updateField('close', 'positive', e.target.value)}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>If they say no</Text>
            <QuickFill presets={CLOSE_NO_PRESETS} onSelect={u('close', 'neutral')} />
            <TextArea
              rows={2}
              placeholder='How you end the call gracefully if they pass.'
              value={data.close.neutral}
              onChange={e => updateField('close', 'neutral', e.target.value)}
            />
          </div>
        </Space>
      ),
    },
    {
      key: 'afterCall',
      label: '📝 After the Call (Internal)',
      children: (
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
          <Text type="secondary" italic style={{ fontSize: 11 }}>
            ℹ️ This section is for your internal use only — it won't appear in the script preview.
          </Text>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Collapse
        defaultActiveKey={['opener', 'permissionAsk', 'qualifyingQuestion', 'reasonForCall']}
        items={items}
        style={{ marginBottom: 16 }}
      />
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
    </>
  );
};

export default ScriptBuilder;
