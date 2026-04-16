import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme, Layout, Typography, Switch, Space, Row, Col } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import ScriptBuilder from './components/ScriptBuilder';
import ScriptPreview from './components/ScriptPreview';
import { useScriptData } from './hooks/useScriptData';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const DARK_KEY = 'cold-call-dark-mode';

const App: React.FC = () => {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem(DARK_KEY) === 'true'; } catch { return false; }
  });
  const { data, updateField, updateSection, clearAll } = useScriptData();

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
      <Layout style={{ minHeight: '100vh', background: dark ? '#141414' : '#f5f5f5' }}>
        <Header
          className="no-print"
          style={{
            background: dark ? '#1f1f1f' : '#fff',
            borderBottom: `1px solid ${dark ? '#303030' : '#f0f0f0'}`,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: 'auto',
            minHeight: 64,
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, lineHeight: '1.4' }}>
              📞 Cold Call Script Creator
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Build a structured cold call script step by step
            </Text>
          </div>
          <Space>
            {dark ? <BulbFilled /> : <BulbOutlined />}
            <Switch
              checked={dark}
              onChange={setDark}
              checkedChildren="Dark"
              unCheckedChildren="Light"
            />
          </Space>
        </Header>

        <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <ScriptBuilder data={data} updateField={updateField} updateSection={updateSection} />
            </Col>
            <Col xs={24} lg={12}>
              <div style={{ position: 'sticky', top: 80 }}>
                <ScriptPreview data={data} onClearAll={clearAll} />
              </div>
            </Col>
          </Row>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
