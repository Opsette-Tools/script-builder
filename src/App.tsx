import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider, theme, Layout, Typography, Switch, Space, Row, Col, Segmented, Select, Modal, Alert, Grid, message } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import ScriptBuilder from './components/ScriptBuilder';
import ScriptPreview from './components/ScriptPreview';
import QuickStart from './components/QuickStart';
import Logo from './components/Logo';
import ScriptManager from './components/ScriptManager';
import EmptyScriptState from './components/EmptyScriptState';
import { useScripts } from './hooks/useScripts';
import { ScriptStyle, SCRIPT_STYLES } from './types';

const { useBreakpoint } = Grid;

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph, Link } = Typography;

const DARK_KEY = 'cold-call-dark-mode';

const App: React.FC = () => {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem(DARK_KEY) === 'true'; } catch { return false; }
  });
  const [aboutOpen, setAboutOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const {
    scripts,
    activeId,
    activeScript,
    data,
    isDirty,
    activeDirty,
    dirtyIds,
    bridgeActive,
    updateField,
    updateSection,
    replaceAll,
    clearActive,
    saveAll,
    discardDraft,
    createScript,
    openScript,
    renameScript,
    saveAs,
    duplicateScript,
    deleteScript,
  } = useScripts();

  const [messageApi, messageHolder] = message.useMessage();

  const handleSave = useCallback(async () => {
    const result = await saveAll();
    if (result.savedCount === 0 && result.errors.length === 0) return;
    if (result.ok) {
      messageApi.success(result.savedCount === 1 ? 'Saved' : `Saved ${result.savedCount} scripts`);
    } else if (result.savedCount > 0) {
      messageApi.warning(`Saved ${result.savedCount}, ${result.errors.length} failed. Try again.`);
    } else {
      messageApi.error("Couldn't save. Try again in a moment.");
    }
  }, [saveAll, messageApi]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
      if (!isSave) return;
      e.preventDefault();
      if (isDirty) handleSave();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDirty, handleSave]);

  useEffect(() => {
    try { localStorage.setItem(DARK_KEY, String(dark)); } catch {}
    document.body.style.background = dark ? '#141414' : '#f5f5f5';
  }, [dark]);

  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      {messageHolder}
      <Layout style={{ minHeight: '100vh', background: dark ? '#141414' : '#f5f5f5' }}>
        <Header
          className="no-print"
          style={{
            background: dark ? '#1f1f1f' : '#fff',
            borderBottom: `1px solid ${dark ? '#303030' : '#f0f0f0'}`,
            padding: '14px 24px',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr auto' : '1fr auto 1fr',
            gap: isMobile ? 8 : 12,
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: 'auto',
            minHeight: 72,
            lineHeight: 1.4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScriptManager
              scripts={scripts}
              activeId={activeId}
              activeScript={activeScript}
              isDirty={isDirty}
              activeDirty={activeDirty}
              dirtyIds={dirtyIds}
              onOpen={openScript}
              onCreate={createScript}
              onRename={renameScript}
              onSaveAs={saveAs}
              onDuplicate={duplicateScript}
              onDelete={deleteScript}
              onSave={handleSave}
              onDiscard={discardDraft}
            />
          </div>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', textAlign: 'center' }}>
              <Logo size={32} color="#1677ff" />
              <div>
                <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
                  Script Builder
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Build a cold call script in minutes
                </Text>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
            {dark ? <BulbFilled /> : <BulbOutlined />}
            <Switch
              checked={dark}
              onChange={setDark}
              checkedChildren="Dark"
              unCheckedChildren="Light"
            />
          </div>
        </Header>

        <Content style={{ padding: isMobile ? '20px 16px 16px' : '32px 24px 24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          {!activeScript ? (
            <EmptyScriptState onCreate={createScript} />
          ) : (
          <>
          <QuickStart data={data} onApplyTemplate={replaceAll} />
          <div className="no-print" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
              <Text strong style={{ fontSize: 14 }}>Script Style:</Text>
              {isMobile ? (
                <Select
                  style={{ flex: 1, minWidth: 180 }}
                  value={data.scriptStyle}
                  onChange={(v) => updateSection('scriptStyle', v as ScriptStyle)}
                  options={SCRIPT_STYLES.map(s => ({ value: s.value, label: s.label }))}
                />
              ) : (
                <Segmented
                  value={data.scriptStyle}
                  onChange={(v) => updateSection('scriptStyle', v as ScriptStyle)}
                  options={SCRIPT_STYLES.map(s => ({ value: s.value, label: s.label }))}
                />
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {SCRIPT_STYLES.find(s => s.value === data.scriptStyle)?.hint}
            </Text>
          </div>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              {activeDirty ? (
                <Alert
                  className="no-print"
                  type="warning"
                  showIcon
                  message="Unsaved changes — only stored on this device until you click Save."
                  style={{ fontSize: 12, padding: '6px 12px', marginBottom: 12 }}
                />
              ) : (data.reasonForCall.why || data.problem.mainPain || data.valueProp.pitch || data.cta.line) && (
                <Alert
                  className="no-print"
                  type="info"
                  showIcon
                  message="Loading a new starter above will overwrite the fields below (your name, company, and referrer will be kept)."
                  style={{ fontSize: 12, padding: '6px 12px', marginBottom: 12 }}
                />
              )}
              <ScriptBuilder data={data} updateField={updateField} updateSection={updateSection} onClearAll={clearActive} />
            </Col>
            <Col xs={24} lg={12}>
              <div style={{ position: 'sticky', top: 80 }}>
                <ScriptPreview data={data} />
              </div>
            </Col>
          </Row>
          </>
          )}
        </Content>

        <Footer
          className="no-print"
          style={{
            textAlign: 'center',
            background: 'transparent',
            padding: '16px 24px 24px',
            fontSize: 12,
          }}
        >
          <Space size={8} wrap style={{ justifyContent: 'center' }}>
            <Link onClick={() => setAboutOpen(true)} style={{ fontSize: 12 }}>About</Link>
            <Text type="secondary">·</Text>
            <Link onClick={() => setPrivacyOpen(true)} style={{ fontSize: 12 }}>Privacy</Link>
            <Text type="secondary">·</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              By{' '}
              <Link href="https://opsette.io" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
                Opsette
              </Link>
            </Text>
          </Space>
        </Footer>

        <Modal
          title="About Script Builder"
          open={aboutOpen}
          onCancel={() => setAboutOpen(false)}
          footer={null}
          width={520}
        >
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            A business tool from Opsette Marketplace.
          </Paragraph>
          <Paragraph>
            Script Builder helps service professionals and consultants build a structured cold call
            script they can actually read out loud — no awkward improvising, no blank page.
          </Paragraph>
          <Title level={5} style={{ marginTop: 16 }}>How it works</Title>
          <Paragraph>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li>Pick your industry to pre-fill every section with a ready-to-edit draft.</li>
              <li>Edit any section to make it sound like you.</li>
              <li>Pick a script style — permission, direct, question-led, referral, or value-first.</li>
              <li>Add the objections you expect and your rebuttals.</li>
              <li>Copy, export, or print — then dial.</li>
            </ol>
          </Paragraph>
          <Paragraph type="secondary" italic style={{ fontSize: 12, marginTop: 16 }}>
            Everything runs in your browser. Your scripts are saved locally — nothing is sent to any server.
          </Paragraph>
          <Paragraph style={{ fontSize: 12, marginTop: 8 }}>
            Find more tools at{' '}
            <Link href="https://opsette.io" target="_blank" rel="noopener noreferrer">opsette.io</Link>.
          </Paragraph>
        </Modal>

        <Modal
          title="Privacy Policy"
          open={privacyOpen}
          onCancel={() => setPrivacyOpen(false)}
          footer={null}
          width={520}
        >
          <Paragraph strong>Script Builder respects your privacy.</Paragraph>

          <Title level={5}>No data collection</Title>
          <Paragraph>
            Script Builder runs entirely in your browser. We do not collect, store, or transmit any
            personal information. All interactions happen locally on your device.
          </Paragraph>

          <Title level={5}>No cookies or tracking</Title>
          <Paragraph>
            We do not use cookies, analytics, or any third-party tracking services.
          </Paragraph>

          <Title level={5}>No account required</Title>
          <Paragraph>
            There is no sign-up, no login, and no data stored on any server. Your scripts and settings
            are saved locally in your browser using localStorage and are never shared with anyone.
          </Paragraph>

          <Title level={5}>Contact</Title>
          <Paragraph>
            If you have questions about this policy, reach us through{' '}
            <Link href="https://opsette.io" target="_blank" rel="noopener noreferrer">opsette.io</Link>.
          </Paragraph>

          <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 16 }}>
            Last updated: April 2026
          </Paragraph>
        </Modal>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
