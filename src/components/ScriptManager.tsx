import React, { useState } from 'react';
import { Select, Button, Dropdown, Modal, Input, Form, Popconfirm, Typography, Space, Tooltip, Badge } from 'antd';
import { PlusOutlined, MoreOutlined, EditOutlined, CopyOutlined, DeleteOutlined, SaveOutlined, CheckOutlined } from '@ant-design/icons';
import type { SavedScript } from '../types';

const { Text } = Typography;

interface Props {
  scripts: SavedScript[];
  activeId: string | null;
  activeScript: SavedScript | null;
  isDirty: boolean;
  activeDirty: boolean;
  dirtyIds: Set<string>;
  onOpen: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onSaveAs: (name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: () => void;
  onDiscard: (id?: string) => void;
}

type ModalMode = 'create' | 'rename' | 'saveAs' | null;

const ScriptManager: React.FC<Props> = ({
  scripts,
  activeId,
  activeScript,
  isDirty,
  activeDirty,
  dirtyIds,
  onOpen,
  onCreate,
  onRename,
  onSaveAs,
  onDuplicate,
  onDelete,
  onSave,
  onDiscard,
}) => {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [nameInput, setNameInput] = useState('');

  const openModal = (mode: ModalMode, initial = '') => {
    setNameInput(initial);
    setModalMode(mode);
  };

  const closeModal = () => {
    setModalMode(null);
    setNameInput('');
  };

  const submitModal = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    if (modalMode === 'create') onCreate(trimmed);
    else if (modalMode === 'rename' && activeId) onRename(activeId, trimmed);
    else if (modalMode === 'saveAs') onSaveAs(trimmed);
    closeModal();
  };

  const modalTitle =
    modalMode === 'create' ? 'New script' :
    modalMode === 'rename' ? 'Rename script' :
    modalMode === 'saveAs' ? 'Save as…' : '';

  const menuItems = activeScript ? [
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: 'Rename',
      onClick: () => openModal('rename', activeScript.name),
    },
    {
      key: 'saveAs',
      icon: <SaveOutlined />,
      label: 'Save as…',
      onClick: () => openModal('saveAs', `${activeScript.name} (copy)`),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: 'Duplicate',
      onClick: () => onDuplicate(activeScript.data_id),
    },
    ...(activeDirty ? [{
      key: 'discard',
      icon: <DeleteOutlined />,
      label: 'Discard unsaved changes',
      onClick: () => onDiscard(activeScript.data_id),
    }] : []),
    { type: 'divider' as const },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: (
        <Popconfirm
          title="Delete this script?"
          description={activeDirty ? "You have unsaved changes. Delete anyway?" : "This can't be undone."}
          okText="Delete"
          okButtonProps={{ danger: true }}
          cancelText="Cancel"
          onConfirm={() => onDelete(activeScript.data_id)}
        >
          <span onClick={e => e.stopPropagation()}>Delete</span>
        </Popconfirm>
      ),
      danger: true,
    },
  ] : [];

  const selectOptions = scripts.map(s => ({
    value: s.data_id,
    label: (
      <span>
        {s.name}
        {dirtyIds.has(s.data_id) && (
          <Badge color="#faad14" style={{ marginLeft: 8 }} />
        )}
      </span>
    ),
  }));

  const dirtyCount = dirtyIds.size;
  const saveLabel = !isDirty
    ? 'Saved'
    : dirtyCount > 1 ? `Save ${dirtyCount}` : 'Save';

  return (
    <>
      <Space.Compact style={{ display: 'flex', alignItems: 'center' }}>
        <Select
          style={{ minWidth: 200, maxWidth: 280 }}
          value={activeId ?? undefined}
          onChange={onOpen}
          placeholder="No script open"
          options={selectOptions}
          notFoundContent={<Text type="secondary">No scripts yet</Text>}
        />
        <Tooltip title="New script">
          <Button icon={<PlusOutlined />} onClick={() => openModal('create', '')} />
        </Tooltip>
        {activeScript && (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        )}
      </Space.Compact>

      {activeScript && (
        <Tooltip title={isDirty ? (dirtyCount > 1 ? `Save ${dirtyCount} scripts` : 'Save changes') : 'No unsaved changes'}>
          <Button
            type={isDirty ? 'primary' : 'default'}
            icon={isDirty ? <SaveOutlined /> : <CheckOutlined />}
            onClick={onSave}
            disabled={!isDirty}
            style={{ marginLeft: 8 }}
          >
            {saveLabel}
          </Button>
        </Tooltip>
      )}

      <Modal
        title={modalTitle}
        open={modalMode !== null}
        onCancel={closeModal}
        onOk={submitModal}
        okText={modalMode === 'create' ? 'Create' : modalMode === 'saveAs' ? 'Save' : 'Rename'}
        okButtonProps={{ disabled: !nameInput.trim() }}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="Script name">
            <Input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onPressEnter={submitModal}
              placeholder="e.g. HVAC spring outreach"
              maxLength={80}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ScriptManager;
