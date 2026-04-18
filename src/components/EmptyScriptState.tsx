import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Props {
  onCreate: (name: string) => void;
}

const EmptyScriptState: React.FC<Props> = ({ onCreate }) => {
  const [name, setName] = useState('My Script');
  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
  };

  return (
    <Card style={{ maxWidth: 480, margin: '48px auto', textAlign: 'center' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>Name your first script</Title>
        <Text type="secondary">
          Give it a name you'll recognize. You can create more scripts later.
        </Text>
        <Input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onPressEnter={submit}
          placeholder="e.g. HVAC spring outreach"
          maxLength={80}
          showCount
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={submit}
          disabled={!name.trim()}
          block
        >
          Create script
        </Button>
      </Space>
    </Card>
  );
};

export default EmptyScriptState;
