import React from 'react';
import { Card, Button, Space, Tooltip, Typography, Divider, message, Tag } from 'antd';
import { CopyOutlined, PrinterOutlined, FileTextOutlined } from '@ant-design/icons';
import { ScriptData, ScriptStyle } from '../types';

const { Title, Text, Paragraph } = Typography;

interface Props {
  data: ScriptData;
}

function getGreeting(data: ScriptData): string | null {
  const { yourName, businessName, greetingStyle, referrerName } = data.opener;
  if (!yourName && !businessName) return null;
  const name = yourName || '[Your Name]';
  const biz = businessName || '[Your Company]';
  let base: string;
  switch (greetingStyle) {
    case 'casual': base = `Hey [Prospect Name], this is ${name} from ${biz}.`; break;
    case 'warm': base = `Hi [Prospect Name]! My name is ${name}, and I'm calling from ${biz}.`; break;
    case 'direct': base = `[Prospect Name], ${name}, ${biz}.`; break;
    default: base = `Hello [Prospect Name], my name is ${name} and I'm with ${biz}.`;
  }
  if (data.scriptStyle === 'referral' && referrerName) {
    return `${base} ${referrerName} suggested I give you a call.`;
  }
  return base;
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
    case 'referral': return 'Referral';
    case 'value-first': return 'Value-First';
  }
}

// Maps each script field to its section number in the Builder for a given style.
// Keep in sync with ScriptBuilder.tsx section ordering.
type FieldKey = 'opener' | 'permissionAsk' | 'qualifyingQuestion' | 'reasonForCall' | 'problem' | 'agitate' | 'valueProp' | 'cta' | 'objections' | 'close';

function sectionNumberMap(style: ScriptStyle): Partial<Record<FieldKey, number>> {
  switch (style) {
    case 'permission':
      return { opener: 1, permissionAsk: 2, reasonForCall: 3, problem: 4, agitate: 5, valueProp: 6, qualifyingQuestion: 7, cta: 8, objections: 9, close: 10 };
    case 'question-led':
      return { opener: 1, qualifyingQuestion: 2, reasonForCall: 3, problem: 4, agitate: 5, valueProp: 6, cta: 7, objections: 8, close: 9 };
    case 'direct':
    case 'referral':
    case 'value-first':
    default:
      return { opener: 1, reasonForCall: 2, problem: 3, agitate: 4, valueProp: 5, qualifyingQuestion: 6, cta: 7, objections: 8, close: 9 };
  }
}

const ScriptLine: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <Paragraph style={{ fontSize: 15, marginBottom: 6, ...style }}>{children}</Paragraph>
);

const Section: React.FC<{ title: string; editNums?: number[]; children: React.ReactNode }> = ({ title, editNums, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
      <Text strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.5 }}>
        {title}
      </Text>
      {editNums && editNums.length === 1 && (
        <Text style={{ fontSize: 11, color: '#1677ff', fontWeight: 500 }} className="no-print">
          edit ({editNums[0]})
        </Text>
      )}
    </div>
    <Divider style={{ margin: '4px 0 10px' }} />
    {children}
  </div>
);

const EditHint: React.FC<{ n?: number }> = ({ n }) => {
  if (!n) return null;
  return (
    <Text style={{ fontSize: 11, color: '#1677ff', marginLeft: 6, fontWeight: 500 }} className="no-print">
      ({n})
    </Text>
  );
};

const ScriptPreview: React.FC<Props> = ({ data }) => {
  const greeting = getGreeting(data);
  const style = data.scriptStyle;
  const hasContent = greeting || data.permissionAsk.line || data.reasonForCall.why || data.problem.mainPain;
  const sn = sectionNumberMap(style);
  const num = (k: FieldKey) => sn[k];

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
        <ScriptLine>
          <Text italic>"{data.reasonForCall.why}"</Text>
          <EditHint n={num('reasonForCall')} />
        </ScriptLine>
      )}
      {data.problem.mainPain && (
        <ScriptLine style={{ marginTop: 12 }}>
          <Text italic>"{data.problem.mainPain}"</Text>
          <EditHint n={num('problem')} />
        </ScriptLine>
      )}
      {includeAgitate && data.agitate.consequence && (
        <ScriptLine>
          <Text italic>"{data.agitate.consequence}"</Text>
          <EditHint n={num('agitate')} />
        </ScriptLine>
      )}
      {data.valueProp.pitch && (
        <ScriptLine style={{ marginTop: 12 }}>
          <Text italic>"{data.valueProp.pitch}"</Text>
          <EditHint n={num('valueProp')} />
        </ScriptLine>
      )}
      {includeQuestion && data.qualifyingQuestion.primary && (
        <ScriptLine style={{ marginTop: 12 }}>
          <Text strong>Ask: </Text>
          <Text italic>"{data.qualifyingQuestion.primary}"</Text>
          <EditHint n={num('qualifyingQuestion')} />
        </ScriptLine>
      )}
      {data.cta.line && (
        <ScriptLine style={{ marginTop: 12 }}>
          <Text strong>Next step: </Text>
          <Text italic>"{data.cta.line}"</Text>
          <EditHint n={num('cta')} />
        </ScriptLine>
      )}
    </>
  );

  const renderObjections = () => {
    if (data.objections.length === 0) return null;
    return (
      <Section title="If they push back →" editNums={[num('objections')!]}>
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
      <Section title="Wrap up" editNums={[num('close')!]}>
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
        <Section title="You say" editNums={[num('opener')!]}>
          <ScriptLine><Text italic>"{greeting}"</Text></ScriptLine>
        </Section>
      )}
      {data.permissionAsk.line && (
        <Section title="Then ask" editNums={[num('permissionAsk')!]}>
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
        <Section title="You say" editNums={[num('opener')!]}>
          <ScriptLine><Text italic>"{greeting}"</Text></ScriptLine>
        </Section>
      )}
      {data.reasonForCall.why && (
        <Section title="Get straight to it →" editNums={[num('reasonForCall')!]}>
          <ScriptLine><Text italic>"{data.reasonForCall.why}"</Text></ScriptLine>
        </Section>
      )}
      {(data.problem.mainPain || data.valueProp.pitch || data.cta.line) && (
        <Section title="Build the case →">
          {data.problem.mainPain && (
            <ScriptLine><Text italic>"{data.problem.mainPain}"</Text><EditHint n={num('problem')} /></ScriptLine>
          )}
          {data.agitate.consequence && (
            <ScriptLine><Text italic>"{data.agitate.consequence}"</Text><EditHint n={num('agitate')} /></ScriptLine>
          )}
          {data.valueProp.pitch && (
            <ScriptLine style={{ marginTop: 12 }}><Text italic>"{data.valueProp.pitch}"</Text><EditHint n={num('valueProp')} /></ScriptLine>
          )}
          {data.qualifyingQuestion.primary && (
            <ScriptLine style={{ marginTop: 12 }}>
              <Text strong>Ask: </Text><Text italic>"{data.qualifyingQuestion.primary}"</Text><EditHint n={num('qualifyingQuestion')} />
            </ScriptLine>
          )}
          {data.cta.line && (
            <ScriptLine style={{ marginTop: 12 }}>
              <Text strong>Next step: </Text><Text italic>"{data.cta.line}"</Text><EditHint n={num('cta')} />
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
        <Section title="You say" editNums={[num('opener')!]}>
          <ScriptLine><Text italic>"{greeting}"</Text></ScriptLine>
        </Section>
      )}
      {data.qualifyingQuestion.primary && (
        <Section title="Lead with a question →" editNums={[num('qualifyingQuestion')!]}>
          <ScriptLine><Text italic>"{data.qualifyingQuestion.primary}"</Text></ScriptLine>
        </Section>
      )}
      {(data.problem.mainPain || data.valueProp.pitch || data.cta.line) && (
        <Section title="Then transition →">
          {data.problem.mainPain && (
            <ScriptLine><Text italic>"{data.problem.mainPain}"</Text><EditHint n={num('problem')} /></ScriptLine>
          )}
          {data.valueProp.pitch && (
            <ScriptLine style={{ marginTop: 12 }}><Text italic>"{data.valueProp.pitch}"</Text><EditHint n={num('valueProp')} /></ScriptLine>
          )}
          {data.cta.line && (
            <ScriptLine style={{ marginTop: 12 }}>
              <Text strong>Next step: </Text><Text italic>"{data.cta.line}"</Text><EditHint n={num('cta')} />
            </ScriptLine>
          )}
        </Section>
      )}
      {renderObjections()}
      {renderClose()}
    </>
  );

  const renderReferralStyle = () => (
    <>
      {greeting && (
        <Section title="You say" editNums={[num('opener')!]}>
          <ScriptLine><Text italic>"{greeting}"</Text></ScriptLine>
        </Section>
      )}
      {(data.reasonForCall.why || data.problem.mainPain || data.valueProp.pitch || data.cta.line) && (
        <Section title="Why you're calling →">
          {renderPitchBody(true, true)}
        </Section>
      )}
      {renderObjections()}
      {renderClose()}
    </>
  );

  const renderValueFirstStyle = () => (
    <>
      {greeting && (
        <Section title="You say" editNums={[num('opener')!]}>
          <ScriptLine><Text italic>"{greeting}"</Text></ScriptLine>
        </Section>
      )}
      {data.problem.mainPain && (
        <Section title="Lead with the insight →">
          <ScriptLine><Text italic>"{data.problem.mainPain}"</Text><EditHint n={num('problem')} /></ScriptLine>
          {data.agitate.consequence && (
            <ScriptLine><Text italic>"{data.agitate.consequence}"</Text><EditHint n={num('agitate')} /></ScriptLine>
          )}
        </Section>
      )}
      {(data.reasonForCall.why || data.valueProp.pitch || data.qualifyingQuestion.primary || data.cta.line) && (
        <Section title="Then connect it →">
          {data.reasonForCall.why && (
            <ScriptLine><Text italic>"{data.reasonForCall.why}"</Text><EditHint n={num('reasonForCall')} /></ScriptLine>
          )}
          {data.valueProp.pitch && (
            <ScriptLine style={{ marginTop: 12 }}><Text italic>"{data.valueProp.pitch}"</Text><EditHint n={num('valueProp')} /></ScriptLine>
          )}
          {data.qualifyingQuestion.primary && (
            <ScriptLine style={{ marginTop: 12 }}>
              <Text strong>Ask: </Text><Text italic>"{data.qualifyingQuestion.primary}"</Text><EditHint n={num('qualifyingQuestion')} />
            </ScriptLine>
          )}
          {data.cta.line && (
            <ScriptLine style={{ marginTop: 12 }}>
              <Text strong>Next step: </Text><Text italic>"{data.cta.line}"</Text><EditHint n={num('cta')} />
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
      styles={{ header: { paddingTop: 16, paddingBottom: 12 }, body: { paddingTop: 20 } }}
      title={
        <div>
          <Space style={{ marginBottom: 8 }}>
            <Title level={4} style={{ margin: 0 }}>📋 Your Script</Title>
            <Tag color="blue" style={{ marginInlineEnd: 0 }}>{styleLabel(style)}</Tag>
          </Space>
          <Space size={4} className="no-print" style={{ display: 'flex' }}>
            <Tooltip title="Copy to clipboard">
              <Button size="small" type="text" icon={<CopyOutlined />} onClick={handleCopy} disabled={!hasContent} />
            </Tooltip>
            <Tooltip title="Export as .txt">
              <Button size="small" type="text" icon={<FileTextOutlined />} onClick={handleExport} disabled={!hasContent} />
            </Tooltip>
            <Tooltip title="Print">
              <Button size="small" type="text" icon={<PrinterOutlined />} onClick={() => window.print()} disabled={!hasContent} />
            </Tooltip>
          </Space>
        </div>
      }
    >
      {!hasContent ? (
        <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0' }}>
          Start filling in the form above to see your script here.
        </Paragraph>
      ) : (
        <div style={{ lineHeight: 1.9 }}>
          <Paragraph
            type="secondary"
            italic
            className="no-print"
            style={{ fontSize: 12, marginBottom: 16, padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 6 }}
          >
            Read this out loud. If a line doesn't sound like you, rewrite it in the builder. The numbers in parentheses point to the section each line came from.
          </Paragraph>
          {style === 'permission' && renderPermissionStyle()}
          {style === 'direct' && renderDirectStyle()}
          {style === 'question-led' && renderQuestionLedStyle()}
          {style === 'referral' && renderReferralStyle()}
          {style === 'value-first' && renderValueFirstStyle()}
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