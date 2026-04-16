import React from 'react';
import { Card, Input, Button, Space, Select, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, HolderOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ObjectionCard, OBJECTION_PRESETS } from '../types';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  objections: ObjectionCard[];
  onChange: (objections: ObjectionCard[]) => void;
}

function SortableCard({
  card,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  card: ObjectionCard;
  index: number;
  onUpdate: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (card: ObjectionCard) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: 12,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        title={
          <Space>
            <HolderOutlined style={{ cursor: 'grab' }} {...attributes} {...listeners} />
            <Text strong>Objection #{index + 1}</Text>
            {card.label && <Text type="secondary">— {card.label}</Text>}
          </Space>
        }
        extra={
          <Space>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => onDuplicate(card)}
            />
            <Popconfirm
              title="Delete this objection?"
              onConfirm={() => onDelete(card.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Objection Label</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Select or type a label"
              value={card.label || undefined}
              onChange={(val) => onUpdate(card.id, 'label', val)}
              showSearch
              allowClear
              options={OBJECTION_PRESETS.map(p => ({ value: p, label: p }))}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div style={{ padding: '4px 8px', fontSize: 12, color: '#999' }}>
                    Or type a custom label
                  </div>
                </>
              )}
              onSearch={() => {}}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Prospect says</Text>
            <TextArea
              rows={2}
              placeholder='e.g. "We already have a vendor for that."'
              value={card.objectionLine}
              onChange={(e) => onUpdate(card.id, 'objectionLine', e.target.value)}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Your rebuttal</Text>
            <TextArea
              rows={2}
              placeholder="Your response to this objection..."
              value={card.rebuttal}
              onChange={(e) => onUpdate(card.id, 'rebuttal', e.target.value)}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Follow-up question (optional)</Text>
            <Input
              placeholder="A question to re-engage..."
              value={card.followUpQuestion}
              onChange={(e) => onUpdate(card.id, 'followUpQuestion', e.target.value)}
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Fallback CTA (optional)</Text>
            <Input
              placeholder="If they still resist..."
              value={card.fallbackCta}
              onChange={(e) => onUpdate(card.id, 'fallbackCta', e.target.value)}
            />
          </div>
        </Space>
      </Card>
    </div>
  );
}

const ObjectionCards: React.FC<Props> = ({ objections, onChange }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addObjection = () => {
    const newCard: ObjectionCard = {
      id: Date.now().toString(),
      label: '',
      objectionLine: '',
      rebuttal: '',
      followUpQuestion: '',
      fallbackCta: '',
    };
    onChange([...objections, newCard]);
  };

  const updateCard = (id: string, field: string, value: string) => {
    onChange(objections.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const deleteCard = (id: string) => {
    onChange(objections.filter(c => c.id !== id));
  };

  const duplicateCard = (card: ObjectionCard) => {
    const dup: ObjectionCard = { ...card, id: Date.now().toString() };
    const idx = objections.findIndex(c => c.id === card.id);
    const next = [...objections];
    next.splice(idx + 1, 0, dup);
    onChange(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = objections.findIndex(c => c.id === active.id);
      const newIndex = objections.findIndex(c => c.id === over.id);
      onChange(arrayMove(objections, oldIndex, newIndex));
    }
  };

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={objections.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {objections.map((card, i) => (
            <SortableCard
              key={card.id}
              card={card}
              index={i}
              onUpdate={updateCard}
              onDelete={deleteCard}
              onDuplicate={duplicateCard}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button type="dashed" icon={<PlusOutlined />} onClick={addObjection} block>
        Add Objection
      </Button>
    </div>
  );
};

export default ObjectionCards;
