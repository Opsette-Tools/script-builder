import React from 'react';
import { Card, Button, Space, Tooltip, Typography, Divider, message, Tag } from 'antd';
import { CopyOutlined, PrinterOutlined, FileTextOutlined } from '@ant-design/icons';
import { ScriptData, ScriptStyle, BuiltinSectionKey, CustomSection } from '../types';
import { getSectionList, SectionListEntry, builtinLabel } from '../lib/sections';

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

function styleLabel(s: ScriptStyle): string {
  switch (s) {
    case 'permission': return 'Permission-Based';
    case 'direct': return 'Direct';
    case 'question-led': return 'Question-Led';
    case 'referral': return 'Referral';
    case 'value-first': return 'Value-First';
  }
}

function builtinHasContent(key: BuiltinSectionKey, data: ScriptData): boolean {
  switch (key) {
    case 'opener': return !!getGreeting(data);
    case 'permissionAsk': return !!data.permissionAsk.line.trim();
    case 'qualifyingQuestion':
      return !!data.qualifyingQuestion.primary.trim()
        || (data.qualifyingQuestion.extra ?? []).some(q => q.trim());
    case 'reasonForCall': return !!data.reasonForCall.why.trim();
    case 'problem': return !!data.problem.mainPain.trim();
    case 'agitate': return !!data.agitate.consequence.trim();
    case 'valueProp': return !!data.valueProp.pitch.trim();
    case 'cta': return !!data.cta.line.trim();
    case 'objections': return data.objections.length > 0;
    case 'close': return !!data.close.positive.trim() || !!data.close.neutral.trim();
  }
}

function customHasContent(c: CustomSection): boolean {
  if (c.kind === 'free-text') return !!c.body.trim();
  return c.branches.some(b => b.trigger.trim() || b.response.trim());
}

function buildPlainText(data: ScriptData): string {
  const lines: string[] = [`=== COLD CALL SCRIPT (${styleLabel(data.scriptStyle)}) ===\n`];
  const visible = getSectionList(data).filter(e => !e.hidden);

  for (const entry of visible) {
    if (entry.isCustom && entry.custom) {
      if (!customHasContent(entry.custom)) continue;
      lines.push(`${entry.number}. ${entry.label.toUpperCase()}:`);
      if (entry.custom.kind === 'free-text') {
        lines.push(entry.custom.body, '');
      } else {
        for (const b of entry.custom.branches) {
          if (!b.trigger.trim() && !b.response.trim()) continue;
          lines.push(`  IF: ${b.trigger}`);
          lines.push(`  YOU SAY: ${b.response}`);
        }
        lines.push('');
      }
      continue;
    }
    const key = entry.builtinKey!;
    if (!builtinHasContent(key, data)) continue;
    const heading = `${entry.number}. ${builtinLabel(key, data.scriptStyle).toUpperCase()}`;
    switch (key) {
      case 'opener': {
        const g = getGreeting(data);
        if (g) lines.push(`${heading}:`, g, '');
        break;
      }
      case 'permissionAsk':
        lines.push(`${heading}:`, data.permissionAsk.line, '');
        break;
      case 'qualifyingQuestion': {
        lines.push(`${heading}:`);
        if (data.qualifyingQuestion.primary.trim()) lines.push(data.qualifyingQuestion.primary);
        for (const q of data.qualifyingQuestion.extra ?? []) {
          if (q.trim()) lines.push(`  → ${q}`);
        }
        lines.push('');
        break;
      }
      case 'reasonForCall':
        lines.push(`${heading}:`, data.reasonForCall.why, '');
        break;
      case 'problem':
        lines.push(`${heading}:`, data.problem.mainPain, '');
        break;
      case 'agitate':
        lines.push(`${heading}:`, data.agitate.consequence, '');
        break;
      case 'valueProp':
        lines.push(`${heading}:`, data.valueProp.pitch, '');
        break;
      case 'cta':
        lines.push(`${heading}:`, data.cta.line, '');
        break;
      case 'objections':
        lines.push(`${heading}:`);
        data.objections.forEach((o, i) => {
          lines.push(`  #${i + 1} ${o.label || 'Untitled'}`);
          if (o.objectionLine) lines.push(`    They say: "${o.objectionLine}"`);
          if (o.rebuttal) lines.push(`    You say: "${o.rebuttal}"`);
          if (o.followUpQuestion) lines.push(`    Then ask: "${o.followUpQuestion}"`);
          if (o.fallbackCta) lines.push(`    Fallback: "${o.fallbackCta}"`);
        });
        lines.push('');
        break;
      case 'close':
        lines.push(`${heading}:`);
        if (data.close.positive) lines.push(`  ✓ If yes: ${data.close.positive}`);
        if (data.close.neutral) lines.push(`  ✗ If no: ${data.close.neutral}`);
        lines.push('');
        break;
    }
  }
  return lines.join('\n').trimEnd();
}

const ScriptLine: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <Paragraph style={{ fontSize: 15, marginBottom: 6, ...style }}>{children}</Paragraph>
);

const SectionHeader: React.FC<{ entry: SectionListEntry }> = ({ entry }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
    <Tag color="blue" style={{ marginInlineEnd: 0 }}>{entry.number}</Tag>
    <Text strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 }}>
      {entry.label}
    </Text>
  </div>
);

const renderBuiltinPreview = (entry: SectionListEntry, data: ScriptData): React.ReactNode => {
  const key = entry.builtinKey!;
  if (!builtinHasContent(key, data)) return null;

  switch (key) {
    case 'opener': {
      const g = getGreeting(data);
      if (!g) return null;
      return (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader entry={entry} />
          <Divider style={{ margin: '4px 0 10px' }} />
          <ScriptLine><Text italic>"{g}"</Text></ScriptLine>
        </div>
      );
    }
    case 'permissionAsk':
      return (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader entry={entry} />
          <Divider style={{ margin: '4px 0 10px' }} />
          <ScriptLine><Text italic>"{data.permissionAsk.line}"</Text></ScriptLine>
        </div>
      );
    case 'qualifyingQuestion':
      return (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader entry={entry} />
          <Divider style={{ margin: '4px 0 10px' }} />
          {data.qualifyingQuestion.primary.trim() && (
            <ScriptLine>
              <Text strong>Ask: </Text>
              <Text italic>"{data.qualifyingQuestion.primary}"</Text>
            </ScriptLine>
          )}
          {(data.qualifyingQuestion.extra ?? []).map((q, idx) => (
            q.trim() ? (
              <ScriptLine key={idx} style={{ marginLeft: 16 }}>
                <Text strong>→ Then: </Text>
                <Text italic>"{q}"</Text>
              </ScriptLine>
            ) : null
          ))}
        </div>
      );
    case 'reasonForCall':
      return (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader entry={entry} />
          <Divider style={{ margin: '4px 0 10px' }} />
          <ScriptLine><Text italic>"{data.reasonForCall.why}"</Text></ScriptLine>
        </div>
      );
    case 'problem':
      return (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader entry={entry} />
          <Divider style={{ margin: '4px 0 10px' }} />
          <ScriptLine><Text italic>"{data.problem.mainPain}"</Text></ScriptLine>
        </div>
      );
    case 'agitate':
      return (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader entry={entry} />
          <Divider style={{ margin: '4px 0 10px' }} />
          <ScriptLine><Text italic>"{data.agitate.consequence}"</Text></ScriptLine>
        </div>
      );
    case 'valueProp':
      return (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader entry={entry} />
          <Divider style={{ margin: '4px 0 10px' }} />
          <ScriptLine><Text italic>"{data.valueProp.pitch}"</Text></ScriptLine>
        </div>
      );
    case 'cta':
      return (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader entry={entry} />
          <Divider style={{ margin: '4px 0 10px' }} />
          <ScriptLine>
            <Text strong>Next step: </Text>
            <Text italic>"{data.cta.line}"</Text>
          </ScriptLine>
        </div>
      );
    case 'objections':
      return (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader entry={entry} />
          <Divider style={{ margin: '4px 0 10px' }} />
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
        </div>
      );
    case 'close':
      return (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader entry={entry} />
          <Divider style={{ margin: '4px 0 10px' }} />
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
        </div>
      );
  }
};

const renderCustomPreview = (entry: SectionListEntry): React.ReactNode => {
  const c = entry.custom!;
  if (!customHasContent(c)) return null;

  if (c.kind === 'free-text') {
    return (
      <div style={{ marginBottom: 24 }}>
        <SectionHeader entry={entry} />
        <Divider style={{ margin: '4px 0 10px' }} />
        {c.body.split(/\n\n+/).map((para, i) => (
          <ScriptLine key={i}><Text italic>"{para.trim()}"</Text></ScriptLine>
        ))}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <SectionHeader entry={entry} />
      <Divider style={{ margin: '4px 0 10px' }} />
      {c.branches.map(b => (
        (b.trigger.trim() || b.response.trim()) ? (
          <Card key={b.id} size="small" style={{ marginBottom: 10, background: 'rgba(125, 60, 200, 0.04)' }}>
            {b.trigger.trim() && (
              <div>
                <Text strong style={{ color: '#722ed1' }}>If they: </Text>
                <Text italic>"{b.trigger}"</Text>
              </div>
            )}
            {b.response.trim() && (
              <div style={{ marginTop: 6 }}>
                <Text strong style={{ color: '#389e0d' }}>You say: </Text>
                <Text italic>"{b.response}"</Text>
              </div>
            )}
          </Card>
        ) : null
      ))}
    </div>
  );
};

const ScriptPreview: React.FC<Props> = ({ data }) => {
  const entries = getSectionList(data).filter(e => !e.hidden);
  const style = data.scriptStyle;

  const hasContent = entries.some(e => {
    if (e.isCustom && e.custom) return customHasContent(e.custom);
    return e.builtinKey ? builtinHasContent(e.builtinKey, data) : false;
  });

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

  const handlePrint = () => {
    window.print();
  };

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
              <Button size="small" type="text" icon={<PrinterOutlined />} onClick={handlePrint} disabled={!hasContent} />
            </Tooltip>
          </Space>
        </div>
      }
    >
      {!hasContent ? (
        <Paragraph type="secondary" style={{ textAlign: 'center', padding: '40px 0' }}>
          Start filling in the form to see your script here.
        </Paragraph>
      ) : (
        <div style={{ lineHeight: 1.9 }}>
          <Paragraph
            type="secondary"
            italic
            className="no-print"
            style={{ fontSize: 12, marginBottom: 16, padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 6 }}
          >
            Read this out loud. If a line doesn't sound like you, rewrite it in the builder. The numbered tags match the section order on the left.
          </Paragraph>
          {entries.map(entry => (
            <React.Fragment key={entry.id}>
              {entry.isCustom ? renderCustomPreview(entry) : renderBuiltinPreview(entry, data)}
            </React.Fragment>
          ))}
          {(data.afterCall.ifYes || data.afterCall.ifNo || data.afterCall.notes) && (
            <>
              <Divider />
              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.5 }}>
                  📝 Internal Notes (not part of the script)
                </Text>
                <Divider style={{ margin: '4px 0 10px' }} />
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
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default ScriptPreview;
