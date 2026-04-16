import React from 'react';
import { Card, Button, Space, Popconfirm, Typography, Divider, message, Tag } from 'antd';
import { CopyOutlined, DeleteOutlined, PrinterOutlined, FileTextOutlined } from '@ant-design/icons';
import { ScriptData, ScriptStyle } from '../types';

const { Title, Text, Paragraph } = Typography;

interface Props {
  data: ScriptData;
  onClearAll: () => void;
}

function getGreeting(data: ScriptData): string | null {
  const { yourName, businessName, greetingStyle } = data.opener;
  if (!yourName && !businessName) return null;
  const name = yourName || '[Your Name]';
  const biz = businessName || '[Your Company]';
  switch (greetingStyle) {
    case 'casual': return `Hey [Prospect Name], this is ${name} from ${biz}.`;
    case 'warm': return `Hi [Prospect Name]! My name is ${name}, and I'm calling from ${biz}.`;
    case 'direct': return `[Prospect Name], ${name}, ${biz}.`;
    default: return `Hello [Prospect Name], my name is ${name} and I'm with ${biz}.`;
  }
}

function buildPlainText(data: ScriptData): string {
  const lines: string[] = [`=== COLD CALL SCRIPT (${styleLabel(data.scriptStyle)}) ===\n`];
  const greeting = getGreeting(data);
  if (greeting) { lines.push('OPENER:', greeting, ''); }

  if (data.scriptStyle === 'permission' && data.permissionAsk.line) {
    lines.push('PERMISSION:', data.permissionAsk.line, '');
  }
  if (data.scriptStyle === 'question-led' && data.qualifyingQuestion.primary) {
    lines.push('OPENING QUESTION:', data.qualifyingQuestion.primary, '');
  }
  if (data.reasonForCall.why) { lines.push('REASON:', data.reasonForCall.why, ''); }
  if (data.problem.mainPain) { lines.push('PROBLEM:', data.problem.mainPain, ''); }
  if (data.scriptStyle !== 'question-led' && data.agitate.consequence) {
    lines.push('WHY IT MATTERS:', data.agitate.consequence, '');
  }
  if (data.valueProp.pitch) { lines.push('VALUE:', data.valueProp.pitch, ''); }
  if (data.scriptStyle !== 'question-led' && data.qualifyingQuestion.primary) {
    lines.push('ASK:', data.qualifyingQuestion.primary, '');
  }
  if (data.cta.line) { lines.push('NEXT STEP:', data.cta.line, ''); }
  if (data.objections.length > 0) {
    lines.push('OBJECTIONS:');
    data.objections.forEach((o, i) => {
      lines.push(`  #${i + 1} ${o.label || 'Untitled'}`);
      if (o.objectionLine) lines.push(`    They say: "${o.objectionLine}"`);
      if (o.rebuttal) lines.push(`    You say: "${o.rebuttal}"`);
      if (o.followUpQuestion) lines.push(`    Then ask: "${o.followUpQuestion}"`);
      if (o.fallbackCta) lines.push(`    Fallback: "${o.fallbackCta}"`);
    });
    lines.push('');
  }
  if (data.close.positive) lines.push(`CLOSE (yes): ${data.close.positive}`);
  if (data.close.neutral) lines.push(`CLOSE (no): ${data.close.neutral}`);
  return lines.join('\n');
}

function styleLabel(s: ScriptStyle): string {
  switch (s) {
    case 'permission': return 'Permission-Based';
    case 'direct': return 'Direct';
    case 'question-led': return 'Question-Led';
  }
}

const ScriptLine: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <Paragraph style={{ fontSize: 15, marginBottom: 6, ...style }}>{children}</Paragraph>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <Text strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.5 }}>
      {title}
    </Text>
    <Divider style={{ margin: '4px 0 10px' }} />
    {children}
  </div>
);

const ScriptPreview: React.FC<Props> = ({ data, onClearAll }) => {
  const greeting = getGreeting(data);
  const style = data.scriptStyle;
  const hasContent = greeting || data.permissionAsk.line || data.reasonForCall.why || data.problem.mainPain;

  const handleCopy = () => {
    navigator.clipboard.writeText(buildPlainText(data)).then(
      () => message.success('Script copied!'),
      () => message.error('Failed to copy')
    );
  };

  const handleExport = () => {
    const blob = new Blob([buildPlainText(data)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cold-call-script.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render the pitch body (problem → agitate → value → question → CTA)
  const renderPitchBody = (includeAgitate: boolean, includeQuestion: boolean) => (
    <>
      {data.reasonForCall.why && style !== 'question-led' && (
        <ScriptLine><Text italic>"{data.reasonForCall.why}"</Text></ScriptLine>
      )}
      {data.problem.mainPain && (
        <ScriptLine style={{ marginTop: 12 }}>
          <Text italic>"{data.problem.mainPain}"</Text>
        </ScriptLine>
      )}
      {includeAgitate && data.agitate.consequence && (
        <ScriptLine>
          <Text italic>"{data.agitate.consequence}"</Text>
        </ScriptLine>
      )}
      {data.valueProp.pitch && (
        <ScriptLine style={{ marginTop: 12 }}>
          <Text italic>"{data.valueProp.pitch}"</Text>
        </ScriptLine>
      )}
      {includeQuestion && data.qualifyingQuestion.primary && (
        <ScriptLine style={{ marginTop: 12 }}>
          <Text strong>Ask: </Text>
          <Text italic>"{data.qualifyingQuestion.primary}"</Text>
        </ScriptLine>
      )}
      {data.cta.line && (
        <ScriptLine style={{ marginTop: 12 }}>
          <Text strong>Next step: </Text>
          <Text italic>"{data.cta.line}"</Text>
        </ScriptLine>
      )}
    </>
  );

  const renderObjections = () => {
    if (data.objections.length === 0) return null;
    return (
      <Section title="If they push back →">
        {data.objections.map((obj) => (
          <Card key={obj.id} size="small" style={{ marginBottom: 10, background: 'rgba(0,0,0,0.02)' }}>
            {(obj.objectionLine || obj.label) && (
              <div>
                <Text strong style={{ color: '#cf1322' }}>They say: </Text>
                <Text italic>"{obj.objectionLine || obj.label}"</Text>
              </div>
            )}
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
    );
  };

  const renderClose = () => {
    if (!data.close.positive && !data.close.neutral) return null;
    return (
      <Section title="Wrap up">
        {data.close.positive && (
          <ScriptLine>
            <Text strong style={{ color: '#389e0d' }}>✓ If yes: </Text>
            <Text italic>"{data.close.positive}"</Text>
          </ScriptLine>
        )}
        {data.close.neutral && (
          <ScriptLine>
            <Text strong>✗ If no: </Text>
            <Text italic>"{data.close.neutral}"</Text>
          </ScriptLine>
        )}
      </Section>
    );
  };

  const renderPermissionStyle = () => (
    <>
      {greeting && (
        <Section title="You say">
          <ScriptLine><Text italic>"{greeting}"</Text></ScriptLine>
        </Section>
      )}
      {data.permissionAsk.line && (
        <Section title="Then ask">
          <ScriptLine><Text italic>"{data.permissionAsk.line}"</Text></ScriptLine>
        </Section>
      )}
      {(data.reasonForCall.why || data.problem.mainPain || data.valueProp.pitch || data.cta.line) && (
        <Section title="If they say yes →">
          {renderPitchBody(true, true)}
        </Section>
      )}
      {renderObjections()}
      {renderClose()}
    </>
  );

  const renderDirectStyle = () => (
    <>
      {greeting && (
        <Section title="You say">
          <ScriptLine><Text italic>"{greeting}"</Text></ScriptLine>
        </Section>
      )}
      {data.reasonForCall.why && (
        <Section title="Get straight to it →">
          <ScriptLine><Text italic>"{data.reasonForCall.why}"</Text></ScriptLine>
        </Section>
      )}
      {(data.problem.mainPain || data.valueProp.pitch || data.cta.line) && (
        <Section title="Build the case →">
          {data.problem.mainPain && (
            <ScriptLine><Text italic>"{data.problem.mainPain}"</Text></ScriptLine>
          )}
          {data.agitate.consequence && (
            <ScriptLine><Text italic>"{data.agitate.consequence}"</Text></ScriptLine>
          )}
          {data.valueProp.pitch && (
            <ScriptLine style={{ marginTop: 12 }}><Text italic>"{data.valueProp.pitch}"</Text></ScriptLine>
          )}
          {data.qualifyingQuestion.primary && (
            <ScriptLine style={{ marginTop: 12 }}>
              <Text strong>Ask: </Text><Text italic>"{data.qualifyingQuestion.primary}"</Text>
            </ScriptLine>
          )}
          {data.cta.line && (
            <ScriptLine style={{ marginTop: 12 }}>
              <Text strong>Next step: </Text><Text italic>"{data.cta.line}"</Text>
            </ScriptLine>
          )}
        </Section>
      )}
      {renderObjections()}
      {renderClose()}
    </>
  );

  const renderQuestionLedStyle = () => (
    <>
      {greeting && (
        <Section title="You say">
          <ScriptLine><Text italic>"{greeting}"</Text></ScriptLine>
        </Section>
      )}
      {data.qualifyingQuestion.primary && (
        <Section title="Lead with a question →">
          <ScriptLine><Text italic>"{data.qualifyingQuestion.primary}"</Text></ScriptLine>
        </Section>
      )}
      {(data.problem.mainPain || data.valueProp.pitch || data.cta.line) && (
        <Section title="Then transition →">
          {data.problem.mainPain && (
            <ScriptLine><Text italic>"{data.problem.mainPain}"</Text></ScriptLine>
          )}
          {data.valueProp.pitch && (
            <ScriptLine style={{ marginTop: 12 }}><Text italic>"{data.valueProp.pitch}"</Text></ScriptLine>
          )}
          {data.cta.line && (
            <ScriptLine style={{ marginTop: 12 }}>
              <Text strong>Next step: </Text><Text italic>"{data.cta.line}"</Text>
            </ScriptLine>
          )}
        </Section>
      )}
      {renderObjections()}
      {renderClose()}
    </>
  );

  return (
    <Card
      className="script-preview"
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>📋 Your Script</Title>
          <Tag color="blue">{styleLabel(style)}</Tag>
        </Space>
      }
      extra={
        <Space wrap className="no-print">
          <Button icon={<CopyOutlined />} onClick={handleCopy} type="primary">Copy</Button>
          <Button icon={<FileTextOutlined />} onClick={handleExport}>Export</Button>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
          <Popconfirm title="Clear everything?" description="This can't be undone." onConfirm={onClearAll} okText="Clear" cancelText="Cancel">
            <Button icon={<DeleteOutlined />} danger>Clear All</Button>
          </Popconfirm>
        </Space>
      }
    >
      {!hasContent ? (
        <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0' }}>
          Start filling in the form above to see your script here.
        </Paragraph>
      ) : (
        <div style={{ lineHeight: 1.9 }}>
          {style === 'permission' && renderPermissionStyle()}
          {style === 'direct' && renderDirectStyle()}
          {style === 'question-led' && renderQuestionLedStyle()}
          {(data.afterCall.ifYes || data.afterCall.ifNo || data.afterCall.notes) && (
            <>
              <Divider />
              <Section title="📝 Internal Notes (not part of the script)">
                {data.afterCall.ifYes && (
                  <ScriptLine>
                    <Text strong style={{ color: '#389e0d' }}>✓ If yes: </Text>
                    <Text>{data.afterCall.ifYes}</Text>
                  </ScriptLine>
                )}
                {data.afterCall.ifNo && (
                  <ScriptLine>
                    <Text strong>✗ If no: </Text>
                    <Text>{data.afterCall.ifNo}</Text>
                  </ScriptLine>
                )}
                {data.afterCall.notes && (
                  <ScriptLine>
                    <Text strong>Notes: </Text>
                    <Text>{data.afterCall.notes}</Text>
                  </ScriptLine>
                )}
              </Section>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default ScriptPreview;