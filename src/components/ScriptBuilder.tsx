import React from 'react';
import { Collapse, Input, Select, Space, Typography } from 'antd';
import { ScriptData, GREETING_STYLES, CTA_TYPES } from '../types';
import ObjectionCards from './ObjectionCards';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  data: ScriptData;
  updateField: (section: keyof ScriptData, field: string, value: string) => void;
  updateSection: <K extends keyof ScriptData>(section: K, value: ScriptData[K]) => void;
}

const Field: React.FC<{
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}> = ({ label, placeholder, value, onChange, multiline }) => (
  <div style={{ marginBottom: 12 }}>
    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</Text>
    {multiline ? (
      <TextArea rows={2} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    ) : (
      <Input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    )}
  </div>
);

const ScriptBuilder: React.FC<Props> = ({ data, updateField, updateSection }) => {
  const u = (section: keyof ScriptData) => (field: string) => (value: string) =>
    updateField(section, field, value);

  const items = [
    {
      key: 'opener',
      label: '1. Opener',
      children: (
        <>
          <Field label="Your Name" placeholder="John Smith" value={data.opener.yourName} onChange={u('opener')('yourName')} />
          <Field label="Business Name" placeholder="Acme Solutions" value={data.opener.businessName} onChange={u('opener')('businessName')} />
          <Field label="Prospect Name / Placeholder" placeholder="[Prospect Name]" value={data.opener.prospectName} onChange={u('opener')('prospectName')} />
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Greeting Style</Text>
            <Select
              style={{ width: '100%' }}
              value={data.opener.greetingStyle}
              onChange={v => updateField('opener', 'greetingStyle', v)}
              options={GREETING_STYLES}
            />
          </div>
        </>
      ),
    },
    {
      key: 'permissionAsk',
      label: '2. Permission Ask',
      children: (
        <Field
          label="Permission Ask Line"
          placeholder='e.g. "Did I catch you at a bad time?"'
          value={data.permissionAsk.line}
          onChange={u('permissionAsk')('line')}
        />
      ),
    },
    {
      key: 'reasonForCall',
      label: '3. Reason for Call',
      children: (
        <>
          <Field label="Why you're reaching out" placeholder="The reason for my call is..." value={data.reasonForCall.why} onChange={u('reasonForCall')('why')} multiline />
          <Field label="Target type of business/person" placeholder="e.g. small business owners, marketing directors" value={data.reasonForCall.targetType} onChange={u('reasonForCall')('targetType')} />
          <Field label="Context line" placeholder="Additional context..." value={data.reasonForCall.contextLine} onChange={u('reasonForCall')('contextLine')} multiline />
        </>
      ),
    },
    {
      key: 'problem',
      label: '4. Problem / Pain Statement',
      children: (
        <>
          <Field label="Main pain point" placeholder="The #1 problem your prospect faces" value={data.problem.mainPain} onChange={u('problem')('mainPain')} multiline />
          <Field label="Secondary pain point" placeholder="Another related problem" value={data.problem.secondaryPain} onChange={u('problem')('secondaryPain')} multiline />
          <Field label="Common business frustration" placeholder="A frustration they can relate to" value={data.problem.frustration} onChange={u('problem')('frustration')} multiline />
          <Field label="Short problem summary" placeholder="In one sentence..." value={data.problem.summary} onChange={u('problem')('summary')} multiline />
        </>
      ),
    },
    {
      key: 'agitate',
      label: '5. Agitate / Consequence',
      children: (
        <>
          <Field label="What this problem causes" placeholder="This leads to..." value={data.agitate.causes} onChange={u('agitate')('causes')} multiline />
          <Field label="What it slows down / hurts" placeholder="It affects..." value={data.agitate.slowsDown} onChange={u('agitate')('slowsDown')} multiline />
          <Field label="Why it becomes expensive / frustrating" placeholder="Over time this costs..." value={data.agitate.expensive} onChange={u('agitate')('expensive')} multiline />
        </>
      ),
    },
    {
      key: 'valueProp',
      label: '6. Value Proposition',
      children: (
        <>
          <Field label="Your service / offer" placeholder="We provide..." value={data.valueProp.service} onChange={u('valueProp')('service')} multiline />
          <Field label="Main benefit" placeholder="The biggest benefit is..." value={data.valueProp.mainBenefit} onChange={u('valueProp')('mainBenefit')} multiline />
          <Field label="Secondary benefit" placeholder="You also get..." value={data.valueProp.secondaryBenefit} onChange={u('valueProp')('secondaryBenefit')} />
          <Field label="Differentiator" placeholder="What makes us different..." value={data.valueProp.differentiator} onChange={u('valueProp')('differentiator')} />
          <Field label="Quick proof / credibility line" placeholder="We've helped X companies..." value={data.valueProp.proof} onChange={u('valueProp')('proof')} multiline />
        </>
      ),
    },
    {
      key: 'qualifyingQuestion',
      label: '7. Qualifying Question',
      children: (
        <>
          <Field label="Primary qualifying question" placeholder="How are you currently handling...?" value={data.qualifyingQuestion.primary} onChange={u('qualifyingQuestion')('primary')} multiline />
          <Field label="Secondary qualifying question (optional)" placeholder="Have you considered...?" value={data.qualifyingQuestion.secondary} onChange={u('qualifyingQuestion')('secondary')} multiline />
        </>
      ),
    },
    {
      key: 'cta',
      label: '8. Call to Action',
      children: (
        <>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>CTA Type</Text>
            <Select
              style={{ width: '100%' }}
              value={data.cta.type}
              onChange={v => updateField('cta', 'type', v)}
              options={CTA_TYPES}
            />
          </div>
          <Field label="CTA line" placeholder="Would you be open to a quick 15-minute call?" value={data.cta.line} onChange={u('cta')('line')} multiline />
          <Field label="Alternative CTA line" placeholder="Or I could send you a quick summary..." value={data.cta.alternative} onChange={u('cta')('alternative')} multiline />
        </>
      ),
    },
    {
      key: 'objections',
      label: '9. Objection Handling',
      children: (
        <ObjectionCards
          objections={data.objections}
          onChange={(objections) => updateSection('objections', objections)}
        />
      ),
    },
    {
      key: 'close',
      label: '10. Close / Exit Line',
      children: (
        <>
          <Field label="Positive close line" placeholder="Great, I'll send over a calendar link..." value={data.close.positive} onChange={u('close')('positive')} multiline />
          <Field label="Neutral fallback close line" placeholder="No worries, I appreciate your time..." value={data.close.neutral} onChange={u('close')('neutral')} multiline />
        </>
      ),
    },
  ];

  return (
    <Collapse
      defaultActiveKey={['opener']}
      accordion={false}
      items={items}
      style={{ marginBottom: 16 }}
    />
  );
};

export default ScriptBuilder;
