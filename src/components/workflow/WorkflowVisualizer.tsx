import { useMemo, useCallback, useState, useEffect } from 'react'
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
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkflowNodeComponent } from './WorkflowNodeComponent'
import { AddNodeDialog } from './AddNodeDialog'
import { useCreateWorkflowNode } from '@/api/hooks/useWorkflowNodes'
import type { WorkflowNode } from '@/api/types'

const nodeTypes = { workflowNode: WorkflowNodeComponent }

const EDGE_COLORS = {
  success: '#22c55e',
  failure: '#ef4444',
  always: '#3b82f6',
}

interface WorkflowVisualizerProps {
  workflowId: string
  workflowNodes: WorkflowNode[]
  onNodeClick?: (node: WorkflowNode) => void
}

function layoutNodes(workflowNodes: WorkflowNode[]): { nodes: Node[]; edges: Edge[] } {
  const nodeMap = new Map(workflowNodes.map((n) => [n.id, n]))
  const edges: Edge[] = []

  // Build edges
  for (const wn of workflowNodes) {
    for (const targetId of wn.success_nodes) {
      edges.push({
        id: `e-${wn.id}-${targetId}-success`,
        source: String(wn.id),
        target: String(targetId),
        sourceHandle: 'success',
        style: { stroke: EDGE_COLORS.success, strokeWidth: 2 },
        animated: false,
      })
    }
    for (const targetId of wn.failure_nodes) {
      edges.push({
        id: `e-${wn.id}-${targetId}-failure`,
        source: String(wn.id),
        target: String(targetId),
        sourceHandle: 'failure',
        style: { stroke: EDGE_COLORS.failure, strokeWidth: 2 },
        animated: false,
      })
    }
    for (const targetId of wn.always_nodes) {
      edges.push({
        id: `e-${wn.id}-${targetId}-always`,
        source: String(wn.id),
        target: String(targetId),
        sourceHandle: 'always',
        style: { stroke: EDGE_COLORS.always, strokeWidth: 2 },
        animated: false,
      })
    }
  }

  // Simple topological sort for layers
  const inDegree = new Map<number, number>()
  const children = new Map<number, number[]>()

  for (const wn of workflowNodes) {
    if (!inDegree.has(wn.id)) inDegree.set(wn.id, 0)
    if (!children.has(wn.id)) children.set(wn.id, [])

    const targets = [...wn.success_nodes, ...wn.failure_nodes, ...wn.always_nodes]
    for (const t of targets) {
      inDegree.set(t, (inDegree.get(t) ?? 0) + 1)
      children.get(wn.id)!.push(t)
    }
  }

  const layers: number[][] = []
  let queue = [...workflowNodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id)]

  while (queue.length > 0) {
    layers.push([...queue])
    const next: number[] = []
    for (const id of queue) {
      for (const child of children.get(id) ?? []) {
        const deg = (inDegree.get(child) ?? 1) - 1
        inDegree.set(child, deg)
        if (deg === 0) next.push(child)
      }
    }
    queue = next
  }

  // Position nodes
  const X_GAP = 250
  const Y_GAP = 100
  const nodes: Node[] = []

  for (let col = 0; col < layers.length; col++) {
    const layer = layers[col]!
    const startY = -(layer.length - 1) * Y_GAP / 2

    for (let row = 0; row < layer.length; row++) {
      const wn = nodeMap.get(layer[row]!)
      if (!wn) continue
      nodes.push({
        id: String(wn.id),
        type: 'workflowNode',
        position: { x: col * X_GAP, y: startY + row * Y_GAP },
        data: {
          label: wn.summary_fields?.unified_job_template?.name ?? `Node ${wn.id}`,
          jobType: wn.summary_fields?.unified_job_template?.unified_job_type ?? 'job',
          converge: wn.all_parents_must_converge,
        },
      })
    }
  }

  return { nodes, edges }
}

export function WorkflowVisualizer({ workflowId, workflowNodes, onNodeClick }: WorkflowVisualizerProps) {
  const [showAddNode, setShowAddNode] = useState(false)
  const createNode = useCreateWorkflowNode(workflowId)

  const layout = useMemo(() => layoutNodes(workflowNodes), [workflowNodes])

  const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges)

  // useNodesState/useEdgesState only seed from their argument on first render, so
  // push the recomputed layout into state whenever the workflow data changes —
  // otherwise edge rewiring and node edits never appear (the id-set `key` below
  // only remounts on add/remove).
  useEffect(() => {
    setNodes(layout.nodes)
    setEdges(layout.edges)
  }, [layout, setNodes, setEdges])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const wn = workflowNodes.find((n) => String(n.id) === node.id)
      if (wn && onNodeClick) onNodeClick(wn)
    },
    [workflowNodes, onNodeClick],
  )

  const handleAddNode = (templateId: number, _name: string, _type: string) => {
    createNode.mutate({ unified_job_template: templateId })
  }

  return (
    <div className="relative" style={{ height: '600px' }}>
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

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <Button size="sm" onClick={() => setShowAddNode(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Node
        </Button>
      </div>

      <AddNodeDialog
        open={showAddNode}
        onOpenChange={setShowAddNode}
        onSelect={handleAddNode}
      />
    </div>
  )
}
