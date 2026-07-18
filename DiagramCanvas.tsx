import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Circle, Diamond, Maximize2, Minus,
  Plus, Share2, Square, Trash2,
} from 'lucide-react'
import { Badge } from '../lib/shadcn/badge'
import VideoGeneratorPanel from './ui/VideoGeneratorPanel'

type NodeShape = 'rect' | 'diamond' | 'ellipse' | 'parallelogram'
type DiagramMode = 'flowchart' | 'mindmap' | 'uml'

type DiagramNode = {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  shape: NodeShape
  color: string
}

type DiagramEdge = {
  id: string
  from: string
  to: string
  label: string
}

const SHAPE_COLORS: Record<NodeShape, string> = {
  rect: 'hsl(var(--primary))',
  diamond: 'hsl(var(--chart-2))',
  ellipse: 'hsl(var(--chart-3))',
  parallelogram: 'hsl(var(--chart-4))',
}

const SHAPE_DIMS: Record<NodeShape, { w: number; h: number }> = {
  rect: { w: 120, h: 48 },
  diamond: { w: 110, h: 64 },
  ellipse: { w: 110, h: 44 },
  parallelogram: { w: 120, h: 48 },
}

const FLOWCHART_TEMPLATE: { nodes: Omit<DiagramNode, 'id'>[]; edges: { from: string; to: string; label: string }[] } = {
  nodes: [
    { x: 300, y: 80,  w: 110, h: 44, label: 'Start', shape: 'ellipse', color: SHAPE_COLORS.ellipse },
    { x: 300, y: 180, w: 120, h: 48, label: 'Process', shape: 'rect', color: SHAPE_COLORS.rect },
    { x: 300, y: 290, w: 110, h: 64, label: 'Decision?', shape: 'diamond', color: SHAPE_COLORS.diamond },
    { x: 180, y: 400, w: 120, h: 48, label: 'Option A', shape: 'rect', color: SHAPE_COLORS.rect },
    { x: 420, y: 400, w: 120, h: 48, label: 'Option B', shape: 'rect', color: SHAPE_COLORS.rect },
    { x: 300, y: 500, w: 110, h: 44, label: 'End', shape: 'ellipse', color: SHAPE_COLORS.ellipse },
  ],
  edges: [
    { from: 'n0', to: 'n1', label: '' },
    { from: 'n1', to: 'n2', label: '' },
    { from: 'n2', to: 'n3', label: 'Yes' },
    { from: 'n2', to: 'n4', label: 'No' },
    { from: 'n3', to: 'n5', label: '' },
    { from: 'n4', to: 'n5', label: '' },
  ],
}

const MINDMAP_TEMPLATE: { nodes: Omit<DiagramNode, 'id'>[]; edges: { from: string; to: string; label: string }[] } = {
  nodes: [
    { x: 300, y: 280, w: 130, h: 52, label: 'Central Idea', shape: 'ellipse', color: SHAPE_COLORS.ellipse },
    { x: 80,  y: 160, w: 110, h: 44, label: 'Branch A', shape: 'rect', color: SHAPE_COLORS.rect },
    { x: 520, y: 160, w: 110, h: 44, label: 'Branch B', shape: 'rect', color: SHAPE_COLORS.rect },
    { x: 80,  y: 400, w: 110, h: 44, label: 'Branch C', shape: 'rect', color: SHAPE_COLORS.rect },
    { x: 520, y: 400, w: 110, h: 44, label: 'Branch D', shape: 'rect', color: SHAPE_COLORS.rect },
  ],
  edges: [
    { from: 'n0', to: 'n1', label: '' }, { from: 'n0', to: 'n2', label: '' },
    { from: 'n0', to: 'n3', label: '' }, { from: 'n0', to: 'n4', label: '' },
  ],
}

function getConnPoint(n: DiagramNode, tx: number, ty: number) {
  const dx = tx - n.x, dy = ty - n.y, len = Math.hypot(dx, dy)
  if (len < 0.01) return { x: n.x, y: n.y }
  const nx = dx / len, ny = dy / len
  const hw = n.w / 2, hh = n.h / 2
  const tx2 = hw / (Math.abs(nx) || 1e-9), ty2 = hh / (Math.abs(ny) || 1e-9)
  const t = Math.min(tx2, ty2)
  return { x: n.x + nx * t, y: n.y + ny * t }
}

function renderShape(node: DiagramNode, selected: boolean, connecting: boolean) {
  const { x, y, w, h, shape, color } = node
  const halfW = w / 2, halfH = h / 2
  const stroke = selected ? '#f59e0b' : connecting ? '#22c55e' : color
  const strokeW = selected || connecting ? 2.5 : 1.5
  const fill = color + '22'

  if (shape === 'diamond') {
    const pts = `${x},${y - halfH} ${x + halfW},${y} ${x},${y + halfH} ${x - halfW},${y}`
    return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
  }
  if (shape === 'ellipse') {
    return <ellipse cx={x} cy={y} rx={halfW} ry={halfH} fill={fill} stroke={stroke} strokeWidth={strokeW} />
  }
  if (shape === 'parallelogram') {
    const skew = 14
    const pts = `${x - halfW + skew},${y - halfH} ${x + halfW + skew},${y - halfH} ${x + halfW - skew},${y + halfH} ${x - halfW - skew},${y + halfH}`
    return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={strokeW} />
  }
  return <rect x={x - halfW} y={y - halfH} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={strokeW} />
}

let nodeSeq = 0
function makeId() { return `n${nodeSeq++}` }
function makeNodes(template: typeof FLOWCHART_TEMPLATE['nodes']): DiagramNode[] {
  return template.map((n) => ({ ...n, id: makeId() }))
}

export default function DiagramCanvas() {
  const [videoExpanded, setVideoExpanded] = useState(true)
  const [nodes, setNodes] = useState<DiagramNode[]>(() => makeNodes(FLOWCHART_TEMPLATE.nodes))
  const [edges, setEdges] = useState<DiagramEdge[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [mode, setMode] = useState<DiagramMode>('flowchart')
  const [shape, setShape] = useState<NodeShape>('rect')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const dragRef = useRef<{ nodeId: string; ox: number; oy: number; nx: number; ny: number } | null>(null)
  const panRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Initialize edges correctly from template
  useEffect(() => {
    const ids: string[] = []
    nodeSeq = 0
    const ns = makeNodes(FLOWCHART_TEMPLATE.nodes)
    ns.forEach((n) => ids.push(n.id))
    setNodes(ns)
    setEdges(FLOWCHART_TEMPLATE.edges.map((e, i) => ({
      id: `e${i}`, from: ids[i] ?? '', to: ids[i + 1] ?? '', label: e.label,
    })))
  }, [])

  const getSVGPos = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom }
  }, [pan, zoom])

  const handleBgDblClick = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    if (connectFrom) return
    const pos = getSVGPos(e.clientX, e.clientY)
    const dims = SHAPE_DIMS[shape]
    const newNode: DiagramNode = { id: makeId(), x: pos.x, y: pos.y, ...dims, label: 'Node', shape, color: SHAPE_COLORS[shape] }
    setNodes((prev) => [...prev, newNode])
    setSelected(newNode.id)
  }, [connectFrom, getSVGPos, shape])

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    if (e.shiftKey) {
      if (!connectFrom) { setConnectFrom(nodeId); return }
      if (connectFrom !== nodeId) {
        setEdges((prev) => [...prev, { id: `e${Date.now()}`, from: connectFrom, to: nodeId, label: '' }])
      }
      setConnectFrom(null)
      return
    }
    const node = nodes.find((n) => n.id === nodeId)!
    const pos = getSVGPos(e.clientX, e.clientY)
    dragRef.current = { nodeId, ox: pos.x - node.x, oy: pos.y - node.y, nx: node.x, ny: node.y }
    setSelected(nodeId)
    setConnectFrom(null)
  }, [connectFrom, nodes, getSVGPos])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragRef.current) {
      const pos = getSVGPos(e.clientX, e.clientY)
      const nx = pos.x - dragRef.current.ox
      const ny = pos.y - dragRef.current.oy
      dragRef.current.nx = nx
      dragRef.current.ny = ny
      setNodes((prev) => prev.map((n) => n.id === dragRef.current!.nodeId ? { ...n, x: nx, y: ny } : n))
    } else if (panRef.current) {
      const dx = e.clientX - panRef.current.sx
      const dy = e.clientY - panRef.current.sy
      setPan({ x: panRef.current.px + dx, y: panRef.current.py + dy })
    }
  }, [getSVGPos])

  const handleMouseUp = useCallback(() => {
    dragRef.current = null
    panRef.current = null
  }, [])

  const handleBgMouseDown = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    panRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y }
    setSelected(null)
  }, [pan])

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    setZoom((z) => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)))
  }, [])

  const handleNodeDblClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const node = nodes.find((n) => n.id === nodeId)
    if (node) { setEditingId(nodeId); setEditLabel(node.label) }
  }, [nodes])

  const commitLabel = useCallback(() => {
    if (editingId) setNodes((prev) => prev.map((n) => n.id === editingId ? { ...n, label: editLabel } : n))
    setEditingId(null)
  }, [editingId, editLabel])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName === 'INPUT') return
        if (selected) {
          setNodes((prev) => prev.filter((n) => n.id !== selected))
          setEdges((prev) => prev.filter((e) => e.from !== selected && e.to !== selected))
          setSelected(null)
        }
      }
      if (e.key === 'Escape') { setConnectFrom(null); setEditingId(null) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selected])

  const loadTemplate = (m: DiagramMode) => {
    nodeSeq = 0
    setMode(m)
    const tpl = m === 'mindmap' ? MINDMAP_TEMPLATE : FLOWCHART_TEMPLATE
    const ns = makeNodes(tpl.nodes)
    setNodes(ns)
    const ids = ns.map((n) => n.id)
    setEdges(tpl.edges.map((e, i) => ({
      id: `e${i}`,
      from: ids[parseInt(e.from.replace('n', ''))] ?? '',
      to: ids[parseInt(e.to.replace('n', ''))] ?? '',
      label: e.label,
    })))
    setSelected(null)
    setConnectFrom(null)
    setPan({ x: 0, y: 0 })
    setZoom(1)
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          {(['flowchart', 'mindmap', 'uml'] as DiagramMode[]).map((m) => (
            <button key={m} onClick={() => loadTemplate(m)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border" />
        {([['rect', <Square className="h-3.5 w-3.5" />, 'Process'], ['diamond', <Diamond className="h-3.5 w-3.5" />, 'Decision'], ['ellipse', <Circle className="h-3.5 w-3.5" />, 'Terminal']] as [NodeShape, React.ReactNode, string][]).map(([s, icon, label]) => (
          <button key={s} onClick={() => setShape(s)} title={label}
            className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs transition-colors ${shape === s ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
            {icon}
          </button>
        ))}
        <div className="h-4 w-px bg-border" />
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.1))} className="rounded p-1.5 text-muted-foreground hover:bg-accent"><Plus className="h-3.5 w-3.5" /></button>
        <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))} className="rounded p-1.5 text-muted-foreground hover:bg-accent"><Minus className="h-3.5 w-3.5" /></button>
        <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1) }} className="rounded p-1.5 text-muted-foreground hover:bg-accent"><Maximize2 className="h-3.5 w-3.5" /></button>
        <div className="h-4 w-px bg-border" />
        <button onClick={() => { if (selected) { setNodes((p) => p.filter((n) => n.id !== selected)); setEdges((p) => p.filter((e) => e.from !== selected && e.to !== selected)); setSelected(null) } }} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
        {connectFrom && <Badge variant="secondary" className="gap-1"><Share2 className="h-3 w-3" />Shift+click to connect</Badge>}
        <div className="ml-auto text-xs text-muted-foreground">Double-click canvas to add • Drag to move • Shift+click to connect</div>
      </div>

      {/* ── Video Generator ── middle strip ─────────────────────────── */}
      <VideoGeneratorPanel
        isExpanded={videoExpanded}
        onToggle={() => setVideoExpanded((v) => !v)}
      />

      {/* SVG Canvas */}
      <div className="flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          className="h-full w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          <defs>
            <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse" x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}>
              <path d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
            </pattern>
            <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--muted-foreground))" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" onMouseDown={handleBgMouseDown} onDoubleClick={handleBgDblClick} />

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {edges.map((edge) => {
              const from = nodeMap.get(edge.from), to = nodeMap.get(edge.to)
              if (!from || !to) return null
              const sp = getConnPoint(from, to.x, to.y)
              const ep = getConnPoint(to, from.x, from.y)
              const mx = (sp.x + ep.x) / 2, my = (sp.y + ep.y) / 2
              return (
                <g key={edge.id}>
                  <line x1={sp.x} y1={sp.y} x2={ep.x} y2={ep.y} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} markerEnd="url(#arrow)" />
                  {edge.label && <text x={mx} y={my - 6} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" className="select-none">{edge.label}</text>}
                </g>
              )
            })}

            {/* Nodes */}
            {nodes.map((node) => (
              <g key={node.id} style={{ cursor: 'move' }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onDoubleClick={(e) => handleNodeDblClick(e, node.id)}>
                {renderShape(node, selected === node.id, connectFrom === node.id)}
                {editingId === node.id ? (
                  <foreignObject x={node.x - node.w / 2} y={node.y - 11} width={node.w} height={22}>
                    <input
                      autoFocus value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onBlur={commitLabel}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitLabel() }}
                      style={{ width: '100%', textAlign: 'center', fontSize: 12, background: 'transparent', border: 'none', outline: 'none', color: 'hsl(var(--foreground))' }}
                    />
                  </foreignObject>
                ) : (
                  <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="hsl(var(--foreground))" className="select-none" style={{ pointerEvents: 'none' }}>
                    {node.label}
                  </text>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  )
}
