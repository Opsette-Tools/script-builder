import React, { useState, useMemo } from 'react';
import { Card, Button, Select, Typography, Space, Alert, Input, Row, Col } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { INDUSTRY_TEMPLATES, ScriptData, DEFAULT_SCRIPT_DATA, ObjectionCard, IndustryTemplate } from '../types';

const { Text, Title } = Typography;

interface Props {
  data: ScriptData;
  onApplyTemplate: (next: ScriptData) => void;
}

function replaceToken(value: string | undefined, token: string): string {
  if (!value) return '';
  return value.replace(/\{\{param\}\}/g, token);
}

const QuickStart: React.FC<Props> = ({ data, onApplyTemplate }) => {
  const [industryId, setIndustryId] = useState<string | undefined>(undefined);
  const [paramValue, setParamValue] = useState<string>('');
  const [justApplied, setJustApplied] = useState(false);

  const selected: IndustryTemplate | undefined = useMemo(
    () => INDUSTRY_TEMPLATES.find(t => t.id === industryId),
    [industryId]
  );

  const handleIndustryChange = (id: string) => {
    setIndustryId(id);
    const tpl = INDUSTRY_TEMPLATES.find(t => t.id === id);
    setParamValue(tpl?.paramPrompt?.defaultValue || '');
    setJustApplied(false);
  };

  const applyTemplate = () => {
    if (!selected) return;
    const token = (paramValue || selected.paramPrompt?.defaultValue || '').trim();

    const objectionsWithIds: ObjectionCard[] = (selected.fill.objections || []).map((o, i) => ({
      id: `${Date.now()}-${i}`,
      label: o.label || '',
      objectionLine: replaceToken(o.objectionLine, token),
      rebuttal: replaceToken(o.rebuttal, token),
      followUpQuestion: replaceToken(o.followUpQuestion, token),
      fallbackCta: replaceToken(o.fallbackCta, token),
    }));

    const next: ScriptData = {
      ...DEFAULT_SCRIPT_DATA,
      scriptStyle: data.scriptStyle,
      opener: {
        ...DEFAULT_SCRIPT_DATA.opener,
        yourName: data.opener.yourName,
        businessName: data.opener.businessName,
        greetingStyle: data.opener.greetingStyle,
        referrerName: data.opener.referrerName,
      },
      permissionAsk: selected.fill.permissionAsk
        ? { line: replaceToken(selected.fill.permissionAsk.line, token) }
        : DEFAULT_SCRIPT_DATA.permissionAsk,
      reasonForCall: selected.fill.reasonForCall
        ? { why: replaceToken(selected.fill.reasonForCall.why, token) }
        : DEFAULT_SCRIPT_DATA.reasonForCall,
      problem: selected.fill.problem
        ? { mainPain: replaceToken(selected.fill.problem.mainPain, token) }
        : DEFAULT_SCRIPT_DATA.problem,
      agitate: selected.fill.agitate
        ? { consequence: replaceToken(selected.fill.agitate.consequence, token) }
        : DEFAULT_SCRIPT_DATA.agitate,
      valueProp: selected.fill.valueProp
        ? { pitch: replaceToken(selected.fill.valueProp.pitch, token) }
        : DEFAULT_SCRIPT_DATA.valueProp,
      qualifyingQuestion: selected.fill.qualifyingQuestion
        ? { primary: replaceToken(selected.fill.qualifyingQuestion.primary, token) }
        : DEFAULT_SCRIPT_DATA.qualifyingQuestion,
      cta: selected.fill.cta
        ? { line: replaceToken(selected.fill.cta.line, token) }
        : DEFAULT_SCRIPT_DATA.cta,
      close: selected.fill.close
        ? {
            positive: replaceToken(selected.fill.close.positive, token),
            neutral: replaceToken(selected.fill.close.neutral, token),
          }
        : DEFAULT_SCRIPT_DATA.close,
      objections: objectionsWithIds,
      afterCall: {
        ...DEFAULT_SCRIPT_DATA.afterCall,
        ...(selected.fill.afterCall || {}),
        notes: data.afterCall.notes || DEFAULT_SCRIPT_DATA.afterCall.notes,
      },
    };

    onApplyTemplate(next);
    setJustApplied(true);
  };

  const handleParamChange = (v: string) => {
    setParamValue(v);
    if (justApplied) setJustApplied(false);
  };

  return (
    <Card
      size="small"
      className="no-print"
      style={{ marginBottom: 16, background: 'rgba(22,119,255,0.04)', borderColor: 'rgba(22,119,255,0.3)' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Space align="center">
          <ThunderboltOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <Title level={5} style={{ margin: 0 }}>Quick Start</Title>
        </Space>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Load a starter draft to rewrite in your own words. These are skeletons, not ready scripts.
        </Text>
        <Row gutter={[12, 12]} align="top">
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
              Industry
            </Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Pick an industry..."
              value={industryId}
              onChange={handleIndustryChange}
              options={INDUSTRY_TEMPLATES.map(t => ({
                value: t.id,
                label: `${t.emoji} ${t.label}`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Col>
          <Col xs={24} md={10}>
            {selected?.paramPrompt ? (
              <>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  {selected.paramPrompt.label}
                </Text>
                <Input
                  placeholder={selected.paramPrompt.placeholder}
                  value={paramValue}
                  onChange={(e) => handleParamChange(e.target.value)}
                  maxLength={80}
                  showCount
                />
              </>
            ) : (
              <>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  &nbsp;
                </Text>
                <Input disabled placeholder="Pick an industry to customize" />
              </>
            )}
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
              &nbsp;
            </Text>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={applyTemplate}
              disabled={!industryId}
              block
            >
              Load starter draft
            </Button>
          </Col>
        </Row>
        {justApplied && (
          <Alert
            type="success"
            showIcon
            message="Starter loaded. Read it out loud, rewrite anything that doesn't sound like you."
            style={{ fontSize: 12, padding: '4px 12px' }}
          />
        )}
      </Space>
    </Card>
  );
};

export default QuickStart;
