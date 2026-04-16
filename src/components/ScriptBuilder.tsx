import React from 'react';
import { Collapse, Input, Select, Space, Typography, Button, Tag } from 'antd';
import { ScriptData, GREETING_STYLES, PERMISSION_PRESETS, PROBLEM_PRESETS, CTA_PRESETS } from '../types';
import ObjectionCards from './ObjectionCards';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  data: ScriptData;
  updateField: (section: keyof ScriptData, field: string, value: string) => void;
  updateSection: <K extends keyof ScriptData>(section: K, value: ScriptData[K]) => void;
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

const ScriptBuilder: React.FC<Props> = ({ data, updateField, updateSection }) => {
  const u = (section: keyof ScriptData, field: string) => (value: string) =>
    updateField(section, field, value);

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
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Tone</Text>
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
    {
      key: 'permissionAsk',
      label: '2. Ask Permission to Continue',
      children: (
        <>
          <QuickFill presets={PERMISSION_PRESETS} onSelect={u('permissionAsk', 'line')} />
          <TextArea
            rows={2}
            placeholder='e.g. "Did I catch you at a bad time?"'
            value={data.permissionAsk.line}
            onChange={e => updateField('permissionAsk', 'line', e.target.value)}
          />
        </>
      ),
    },
    {
      key: 'reasonForCall',
      label: '3. Why Are You Calling?',
      children: (
        <TextArea
          rows={3}
          placeholder="The reason I'm calling is..."
          value={data.reasonForCall.why}
          onChange={e => updateField('reasonForCall', 'why', e.target.value)}
        />
      ),
    },
    {
      key: 'problem',
      label: '4. What Problem Do They Have?',
      children: (
        <>
          <QuickFill presets={PROBLEM_PRESETS} onSelect={u('problem', 'mainPain')} />
          <TextArea
            rows={3}
            placeholder="Describe the main pain point your prospect likely faces..."
            value={data.problem.mainPain}
            onChange={e => updateField('problem', 'mainPain', e.target.value)}
          />
        </>
      ),
    },
    {
      key: 'agitate',
      label: '5. Why Should They Care?',
      children: (
        <TextArea
          rows={3}
          placeholder="What happens if they don't fix this problem? What does it cost them?"
          value={data.agitate.consequence}
          onChange={e => updateField('agitate', 'consequence', e.target.value)}
        />
      ),
    },
    {
      key: 'valueProp',
      label: '6. What Do You Offer?',
      children: (
        <TextArea
          rows={3}
          placeholder="Explain what you do, how it helps, and why you're different — in 2–3 sentences."
          value={data.valueProp.pitch}
          onChange={e => updateField('valueProp', 'pitch', e.target.value)}
        />
      ),
    },
    {
      key: 'qualifyingQuestion',
      label: '7. Move Into a Conversation',
      children: (
        <TextArea
          rows={2}
          placeholder='Ask something like: "How are you currently handling...?"'
          value={data.qualifyingQuestion.primary}
          onChange={e => updateField('qualifyingQuestion', 'primary', e.target.value)}
        />
      ),
    },
    {
      key: 'cta',
      label: '8. Ask for the Next Step',
      children: (
        <>
          <QuickFill presets={CTA_PRESETS} onSelect={u('cta', 'line')} />
          <TextArea
            rows={2}
            placeholder="What's the next step you want them to take?"
            value={data.cta.line}
            onChange={e => updateField('cta', 'line', e.target.value)}
          />
        </>
      ),
    },
    {
      key: 'objections',
      label: '9. Handle Objections',
      children: (
        <ObjectionCards
          objections={data.objections}
          onChange={(objections) => updateSection('objections', objections)}
        />
      ),
    },
    {
      key: 'close',
      label: '10. End the Call',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>If they say yes</Text>
            <TextArea
              rows={2}
              placeholder='e.g. "Great, I\'ll send over a calendar link right now."'
              value={data.close.positive}
              onChange={e => updateField('close', 'positive', e.target.value)}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>If they say no</Text>
            <TextArea
              rows={2}
              placeholder='e.g. "No worries at all — I appreciate your time."'
              value={data.close.neutral}
              onChange={e => updateField('close', 'neutral', e.target.value)}
            />
          </div>
        </Space>
      ),
    },
  ];

  return (
    <Collapse
      defaultActiveKey={['opener', 'permissionAsk', 'reasonForCall']}
      items={items}
      style={{ marginBottom: 16 }}
    />
  );
};

export default ScriptBuilder;
