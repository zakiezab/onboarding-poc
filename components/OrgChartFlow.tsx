'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ORG_PEOPLE, DEPARTMENT_MANAGER_ID, type Person } from '@/lib/org-chart';
import { layoutTree, NODE_WIDTH } from '@/lib/org-chart-layout';
import type { Hire } from '@/lib/onboarding-script';
import { theme as t, radius } from '@/lib/theme';

type Props = {
  hire: Hire;
};

type PersonNodeData = {
  name: string;
  title: string;
  department: string;
  location: string;
  isYou: boolean;
  isOnYourChain: boolean;
};

function PersonNode({ data }: NodeProps<Node<PersonNodeData>>) {
  const { name, title, department, location, isYou, isOnYourChain } = data;
  return (
    <div
      style={{
        width: NODE_WIDTH,
        borderRadius: radius.md,
        border: `1.5px solid ${isYou ? t.red : isOnYourChain ? 'rgba(255,59,48,0.4)' : t.border}`,
        background: isYou ? t.redDim : isOnYourChain ? 'rgba(255,59,48,0.06)' : t.bgElevated,
        padding: '0.7rem 0.85rem',
        boxShadow: isYou ? `0 0 0 3px ${t.redGlow}` : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: t.textFaint, border: 'none' }} />
      <div
        style={{
          fontSize: '0.84rem',
          fontWeight: 600,
          color: isYou ? t.red : t.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </div>
      {title && (
        <div
          style={{
            fontSize: '0.72rem',
            color: t.textMuted,
            marginTop: '0.15rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          fontSize: '0.66rem',
          color: t.textFaint,
          marginTop: '0.3rem',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{department}</span>
        {location && <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{location}</span>}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: t.textFaint, border: 'none' }} />
    </div>
  );
}

const nodeTypes = { person: PersonNode };

export default function OrgChartFlow({ hire }: Props) {
  const { nodes, edges, youNodeId } = useMemo(() => buildGraph(hire), [hire]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: t.bg }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ nodes: [{ id: youNodeId }], padding: 3, maxZoom: 0.9 }}
          minZoom={0.05}
          maxZoom={1.5}
          colorMode="dark"
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick
        >
          <Background color={t.border} gap={28} />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            maskColor="rgba(8,8,10,0.75)"
            style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
            nodeColor={(n) => (n.id === youNodeId ? t.red : t.textFaint)}
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

function buildGraph(hire: Hire): { nodes: Node<PersonNodeData>[]; edges: Edge[]; youNodeId: string } {
  const managerId = DEPARTMENT_MANAGER_ID[hire.department];
  const youId = 'you';

  // Full real roster, plus a synthetic "You" node under the hire's resolved
  // real manager. If the department has no mapped manager (shouldn't
  // happen for the POC's six seeded departments), "You" attaches to the CEO
  // so the chart still renders something sensible.
  const layoutInput = [
    ...ORG_PEOPLE.map((p) => ({ id: p.id, parentId: p.managerId })),
    { id: youId, parentId: managerId ?? 'hamad-riaz' },
  ];
  const positions = layoutTree(layoutInput, 'hamad-riaz');

  // Highlight the chain from "You" up to the CEO.
  const chain = new Set<string>();
  {
    let current: string | undefined = managerId;
    while (current) {
      chain.add(current);
      const person: Person | undefined = ORG_PEOPLE.find((p) => p.id === current);
      current = person?.managerId ?? undefined;
    }
  }

  const nodes: Node<PersonNodeData>[] = ORG_PEOPLE.map((p) => ({
    id: p.id,
    type: 'person',
    position: { x: positions[p.id]?.x ?? 0, y: positions[p.id]?.y ?? 0 },
    data: {
      name: p.name,
      title: p.title,
      department: p.department,
      location: p.location,
      isYou: false,
      isOnYourChain: chain.has(p.id),
    },
  }));

  nodes.push({
    id: youId,
    type: 'person',
    position: { x: positions[youId]?.x ?? 0, y: positions[youId]?.y ?? 0 },
    data: {
      name: `${hire.firstName} (You)`,
      title: hire.role,
      department: hire.department,
      location: '',
      isYou: true,
      isOnYourChain: true,
    },
  });

  const edges: Edge[] = [
    ...ORG_PEOPLE.filter((p) => p.managerId).map((p) => ({
      id: `${p.managerId}-${p.id}`,
      source: p.managerId as string,
      target: p.id,
      style: { stroke: chain.has(p.id) && chain.has(p.managerId as string) ? t.redSoft : t.border },
    })),
    {
      id: `${managerId ?? 'hamad-riaz'}-${youId}`,
      source: managerId ?? 'hamad-riaz',
      target: youId,
      style: { stroke: t.red, strokeWidth: 2 },
    },
  ];

  return { nodes, edges, youNodeId: youId };
}
