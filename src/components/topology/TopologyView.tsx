import { useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Loader2 } from 'lucide-react'
import { TopologyNodeComponent } from './TopologyNodeComponent'
import { useInstanceTopology } from '@/api/hooks/useInstances'
import type { Instance } from '@/api/types'

const nodeTypes = { topologyNode: TopologyNodeComponent }

function buildGraph(instances: Instance[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Group by type for layout
  const byType: Record<string, Instance[]> = {}
  for (const inst of instances) {
    const t = inst.node_type
    if (!byType[t]) byType[t] = []
    byType[t].push(inst)
  }

  // Layout in columns by type
  const typeOrder = ['control', 'hybrid', 'execution', 'hop']
  let xOffset = 0

  for (const type of typeOrder) {
    const group = byType[type] ?? []
    const startY = -(group.length - 1) * 120 / 2

    for (let i = 0; i < group.length; i++) {
      const inst = group[i]!
      nodes.push({
        id: String(inst.id),
        type: 'topologyNode',
        position: { x: xOffset, y: startY + i * 120 },
        data: {
          label: inst.hostname,
          nodeType: inst.node_type,
          capacity: inst.capacity,
          consumedCapacity: inst.consumed_capacity,
          version: inst.version,
          lastSeen: inst.last_seen,
          enabled: inst.enabled,
        },
      })
    }

    if (group.length > 0) xOffset += 280
  }

  // Build edges based on node_state (peer connections)
  // Since the Forail API returns peers via separate endpoint,
  // we connect control/hybrid nodes to execution nodes as a basic topology
  const controlIds = instances
    .filter((i) => i.node_type === 'control' || i.node_type === 'hybrid')
    .map((i) => i.id)
  const executionIds = instances
    .filter((i) => i.node_type === 'execution')
    .map((i) => i.id)

  for (const cId of controlIds) {
    for (const eId of executionIds) {
      const inst = instances.find((i) => i.id === eId)
      const isAdding = inst?.node_state === 'provisioning' || inst?.node_state === 'installed'
      edges.push({
        id: `e-${cId}-${eId}`,
        source: String(cId),
        target: String(eId),
        style: {
          stroke: '#94a3b8',
          strokeWidth: 1.5,
          strokeDasharray: isAdding ? '5 5' : undefined,
        },
      })
    }
  }

  // Connect hop nodes to control nodes
  const hopIds = instances.filter((i) => i.node_type === 'hop').map((i) => i.id)
  for (const hId of hopIds) {
    for (const cId of controlIds) {
      edges.push({
        id: `e-${hId}-${cId}`,
        source: String(hId),
        target: String(cId),
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      })
    }
  }

  return { nodes, edges }
}

export function TopologyView() {
  const navigate = useNavigate()
  const { data, isLoading } = useInstanceTopology()
  const instances = data?.results ?? []

  const layout = useMemo(() => buildGraph(instances), [instances])

  const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges)

  // Push refreshed topology (capacity, state, last_seen, added/removed instances)
  // into graph state — useNodesState/useEdgesState only seed on first render.
  useEffect(() => {
    setNodes(layout.nodes)
    setEdges(layout.edges)
  }, [layout, setNodes, setEdges])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      navigate(`/instances/${node.id}`)
    },
    [navigate],
  )

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (instances.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        No instances found.
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  )
}
