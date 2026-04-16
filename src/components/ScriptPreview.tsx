import React from 'react';
import { Card, Button, Space, Popconfirm, Typography, Divider, message } from 'antd';
import { CopyOutlined, DeleteOutlined, PrinterOutlined, FileTextOutlined } from '@ant-design/icons';
import { ScriptData, CTA_TYPES, GREETING_STYLES } from '../types';

const { Title, Text, Paragraph } = Typography;

interface Props {
  data: ScriptData;
  onClearAll: () => void;
}

function buildPlainText(data: ScriptData): string {
  const lines: string[] = [];
  const greetingLabel = GREETING_STYLES.find(g => g.value === data.opener.greetingStyle)?.label || '';
  const ctaLabel = CTA_TYPES.find(c => c.value === data.cta.type)?.label || '';

  lines.push('=== COLD CALL SCRIPT ===\n');

  if (data.opener.yourName || data.opener.businessName || data.opener.prospectName) {
    lines.push('--- OPENER ---');
    const prospect = data.opener.prospectName || '[Prospect Name]';
    if (data.opener.greetingStyle === 'casual') {
      lines.push(`Hey ${prospect}, this is ${data.opener.yourName} from ${data.opener.businessName}.`);
    } else if (data.opener.greetingStyle === 'warm') {
      lines.push(`Hi ${prospect}! My name is ${data.opener.yourName}, and I'm calling from ${data.opener.businessName}.`);
    } else if (data.opener.greetingStyle === 'direct') {
      lines.push(`${prospect}, ${data.opener.yourName}, ${data.opener.businessName}.`);
    } else {
      lines.push(`Hello ${prospect}, my name is ${data.opener.yourName} and I'm with ${data.opener.businessName}.`);
    }
    lines.push('');
  }

  if (data.permissionAsk.line) {
    lines.push('--- PERMISSION ASK ---');
    lines.push(data.permissionAsk.line);
    lines.push('');
  }

  if (data.reasonForCall.why) {
    lines.push('--- REASON FOR CALL ---');
    lines.push(data.reasonForCall.why);
    if (data.reasonForCall.targetType) lines.push(`Target: ${data.reasonForCall.targetType}`);
    if (data.reasonForCall.contextLine) lines.push(data.reasonForCall.contextLine);
    lines.push('');
  }

  if (data.problem.mainPain) {
    lines.push('--- THE PROBLEM ---');
    lines.push(data.problem.mainPain);
    if (data.problem.secondaryPain) lines.push(data.problem.secondaryPain);
    if (data.problem.frustration) lines.push(data.problem.frustration);
    if (data.problem.summary) lines.push(`Summary: ${data.problem.summary}`);
    lines.push('');
  }

  if (data.agitate.causes) {
    lines.push('--- WHY IT MATTERS ---');
    lines.push(data.agitate.causes);
    if (data.agitate.slowsDown) lines.push(data.agitate.slowsDown);
    if (data.agitate.expensive) lines.push(data.agitate.expensive);
    lines.push('');
  }

  if (data.valueProp.service) {
    lines.push('--- VALUE PROPOSITION ---');
    lines.push(data.valueProp.service);
    if (data.valueProp.mainBenefit) lines.push(`Main benefit: ${data.valueProp.mainBenefit}`);
    if (data.valueProp.secondaryBenefit) lines.push(`Also: ${data.valueProp.secondaryBenefit}`);
    if (data.valueProp.differentiator) lines.push(`Differentiator: ${data.valueProp.differentiator}`);
    if (data.valueProp.proof) lines.push(`Proof: ${data.valueProp.proof}`);
    lines.push('');
  }

  if (data.qualifyingQuestion.primary) {
    lines.push('--- QUALIFYING QUESTION ---');
    lines.push(data.qualifyingQuestion.primary);
    if (data.qualifyingQuestion.secondary) lines.push(data.qualifyingQuestion.secondary);
    lines.push('');
  }

  if (data.cta.line) {
    lines.push(`--- CTA (${ctaLabel}) ---`);
    lines.push(data.cta.line);
    if (data.cta.alternative) lines.push(`Alternative: ${data.cta.alternative}`);
    lines.push('');
  }

  if (data.objections.length > 0) {
    lines.push('--- OBJECTION HANDLING ---');
    data.objections.forEach((obj, i) => {
      lines.push(`\nObjection #${i + 1}: ${obj.label || 'Untitled'}`);
      if (obj.objectionLine) lines.push(`  Prospect says: "${obj.objectionLine}"`);
      if (obj.rebuttal) lines.push(`  You say: "${obj.rebuttal}"`);
      if (obj.followUpQuestion) lines.push(`  Then ask: "${obj.followUpQuestion}"`);
      if (obj.fallbackCta) lines.push(`  Fallback: "${obj.fallbackCta}"`);
    });
    lines.push('');
  }

  if (data.close.positive || data.close.neutral) {
    lines.push('--- CLOSE ---');
    if (data.close.positive) lines.push(`If yes: ${data.close.positive}`);
    if (data.close.neutral) lines.push(`If no: ${data.close.neutral}`);
    lines.push('');
  }

  return lines.join('\n');
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 }}>
      {title}
    </Text>
    <Divider style={{ margin: '6px 0 10px' }} />
    {children}
  </div>
);

const ScriptPreview: React.FC<Props> = ({ data, onClearAll }) => {
  const prospect = data.opener.prospectName || '[Prospect Name]';
  const hasContent = Object.values(data.opener).some(v => v && v !== 'professional') ||
    data.permissionAsk.line || data.reasonForCall.why || data.problem.mainPain;

  const handleCopy = () => {
    const text = buildPlainText(data);
    navigator.clipboard.writeText(text).then(() => {
      message.success('Script copied to clipboard!');
    }).catch(() => {
      message.error('Failed to copy');
    });
  };

  const handleExportText = () => {
    const text = buildPlainText(data);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cold-call-script.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  const getGreeting = () => {
    const { yourName, businessName, greetingStyle } = data.opener;
    if (!yourName && !businessName) return null;
    switch (greetingStyle) {
      case 'casual': return `Hey ${prospect}, this is ${yourName} from ${businessName}.`;
      case 'warm': return `Hi ${prospect}! My name is ${yourName}, and I'm calling from ${businessName}.`;
      case 'direct': return `${prospect}, ${yourName}, ${businessName}.`;
      default: return `Hello ${prospect}, my name is ${yourName} and I'm with ${businessName}.`;
    }
  };

  return (
    <Card
      className="script-preview"
      title={<Title level={4} style={{ margin: 0 }}>📋 Your Script</Title>}
      extra={
        <Space wrap className="no-print">
          <Button icon={<CopyOutlined />} onClick={handleCopy} type="primary">Copy</Button>
          <Button icon={<FileTextOutlined />} onClick={handleExportText}>Export .txt</Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
          <Popconfirm title="Clear all fields?" description="This cannot be undone." onConfirm={onClearAll} okText="Clear" cancelText="Cancel">
            <Button icon={<DeleteOutlined />} danger>Clear All</Button>
          </Popconfirm>
        </Space>
      }
    >
      {!hasContent ? (
        <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0' }}>
          Start filling in the form to see your script preview here.
        </Paragraph>
      ) : (
        <div style={{ lineHeight: 1.8 }}>
          {getGreeting() && (
            <Section title="Opener">
              <Paragraph style={{ fontSize: 15 }}>
                <Text italic>"{getGreeting()}"</Text>
              </Paragraph>
            </Section>
          )}

          {data.permissionAsk.line && (
            <Section title="Permission Ask">
              <Paragraph style={{ fontSize: 15 }}>
                <Text italic>"{data.permissionAsk.line}"</Text>
              </Paragraph>
            </Section>
          )}

          {data.permissionAsk.line && (
            <Section title="If They Say Yes →">
              {data.reasonForCall.why && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Reason for Call: </Text>
                  <Text italic>"{data.reasonForCall.why}"</Text>
                  {data.reasonForCall.contextLine && (
                    <Paragraph style={{ marginTop: 4 }}>
                      <Text italic>"{data.reasonForCall.contextLine}"</Text>
                    </Paragraph>
                  )}
                </div>
              )}

              {data.problem.mainPain && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>The Problem: </Text>
                  <Text italic>"{data.problem.mainPain}"</Text>
                  {data.problem.secondaryPain && (
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                      <Text italic>"{data.problem.secondaryPain}"</Text>
                    </Paragraph>
                  )}
                  {data.problem.summary && (
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                      <Text type="secondary">{data.problem.summary}</Text>
                    </Paragraph>
                  )}
                </div>
              )}

              {data.agitate.causes && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Why It Matters: </Text>
                  <Text italic>"{data.agitate.causes}"</Text>
                  {data.agitate.slowsDown && (
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                      <Text italic>"{data.agitate.slowsDown}"</Text>
                    </Paragraph>
                  )}
                  {data.agitate.expensive && (
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                      <Text italic>"{data.agitate.expensive}"</Text>
                    </Paragraph>
                  )}
                </div>
              )}

              {data.valueProp.service && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Value Proposition: </Text>
                  <Text italic>"{data.valueProp.service}"</Text>
                  {data.valueProp.mainBenefit && (
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                      <Text italic>"{data.valueProp.mainBenefit}"</Text>
                    </Paragraph>
                  )}
                  {data.valueProp.proof && (
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                      <Text type="secondary">✓ {data.valueProp.proof}</Text>
                    </Paragraph>
                  )}
                </div>
              )}

              {data.qualifyingQuestion.primary && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Ask: </Text>
                  <Text italic>"{data.qualifyingQuestion.primary}"</Text>
                  {data.qualifyingQuestion.secondary && (
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                      <Text italic>"{data.qualifyingQuestion.secondary}"</Text>
                    </Paragraph>
                  )}
                </div>
              )}

              {data.cta.line && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>CTA: </Text>
                  <Text italic>"{data.cta.line}"</Text>
                  {data.cta.alternative && (
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>
                      <Text type="secondary">Or: </Text>
                      <Text italic>"{data.cta.alternative}"</Text>
                    </Paragraph>
                  )}
                </div>
              )}
            </Section>
          )}

          {data.objections.length > 0 && (
            <Section title="If They Object →">
              {data.objections.map((obj, i) => (
                <Card
                  key={obj.id}
                  size="small"
                  style={{ marginBottom: 10, background: 'rgba(0,0,0,0.02)' }}
                >
                  <div>
                    <Text strong style={{ color: '#cf1322' }}>
                      If prospect says: </Text>
                    <Text italic>"{obj.objectionLine || obj.label || '...'}"</Text>
                  </div>
                  {obj.rebuttal && (
                    <div style={{ marginTop: 6 }}>
                      <Text strong style={{ color: '#389e0d' }}>You say: </Text>
                      <Text italic>"{obj.rebuttal}"</Text>
                    </div>
                  )}
                  {obj.followUpQuestion && (
                    <div style={{ marginTop: 6 }}>
                      <Text strong>Then ask: </Text>
                      <Text italic>"{obj.followUpQuestion}"</Text>
                    </div>
                  )}
                  {obj.fallbackCta && (
                    <div style={{ marginTop: 6 }}>
                      <Text type="secondary">Fallback: "{obj.fallbackCta}"</Text>
                    </div>
                  )}
                </Card>
              ))}
            </Section>
          )}

          {(data.close.positive || data.close.neutral) && (
            <Section title="Close">
              {data.close.positive && (
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ color: '#389e0d' }}>✓ If yes: </Text>
                  <Text italic>"{data.close.positive}"</Text>
                </div>
              )}
              {data.close.neutral && (
                <div>
                  <Text strong>✗ If no: </Text>
                  <Text italic>"{data.close.neutral}"</Text>
                </div>
              )}
            </Section>
          )}
        </div>
      )}
    </Card>
  );
};

export default ScriptPreview;
