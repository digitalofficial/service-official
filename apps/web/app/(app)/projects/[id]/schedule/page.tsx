'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Plus, RefreshCw, ZoomIn, ZoomOut, Diamond,
  ChevronRight, ChevronDown, Trash2, Link2
} from 'lucide-react'
import type { GanttTask, GanttDependency } from '@service-official/types'

const DAY_MS = 86400000
const ZOOM_LEVELS = { day: 30, week: 12, month: 4 }
type ZoomLevel = keyof typeof ZOOM_LEVELS

const TASK_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#65a30d']

export default function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [dependencies, setDependencies] = useState<GanttDependency[]>([])
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState<ZoomLevel>('week')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editTask, setEditTask] = useState<GanttTask | null>(null)
  const [showDepModal, setShowDepModal] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => { fetchGantt() }, [projectId])

  async function fetchGantt() {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/gantt`)
    const json = await res.json()
    setTasks(json.data?.tasks || [])
    setDependencies(json.data?.dependencies || [])
    setLoading(false)
  }

  async function syncPhases() {
    const res = await fetch(`/api/projects/${projectId}/gantt/sync-phases`, { method: 'POST' })
    const json = await res.json()
    if (res.ok) {
      toast.success(`Synced ${json.count} phases`)
      fetchGantt()
    } else {
      toast.error(json.error || 'No phases to sync')
    }
  }

  async function deleteTask(taskId: string) {
    const res = await fetch(`/api/projects/${projectId}/gantt/tasks?task_id=${taskId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Task deleted'); fetchGantt() }
  }

  async function updateTaskDates(taskId: string, startDate: string, endDate: string) {
    await fetch(`/api/projects/${projectId}/gantt/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, start_date: startDate, end_date: endDate }),
    })
    fetchGantt()
  }

  // Calculate timeline bounds
  const allDates = tasks.flatMap(t => [new Date(t.start_date), new Date(t.end_date)])
  const today = new Date()
  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime())) - 7 * DAY_MS) : new Date(today.getTime() - 14 * DAY_MS)
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime())) + 14 * DAY_MS) : new Date(today.getTime() + 90 * DAY_MS)

  const dayWidth = ZOOM_LEVELS[zoom]
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / DAY_MS)
  const chartWidth = totalDays * dayWidth
  const rowHeight = 36
  const headerHeight = 50
  const sidebarWidth = 280
  const chartHeight = headerHeight + tasks.length * rowHeight + 40

  function dateToX(date: string | Date) {
    const d = typeof date === 'string' ? new Date(date) : date
    return ((d.getTime() - minDate.getTime()) / DAY_MS) * dayWidth
  }

  function formatDate(d: Date) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Generate time axis labels
  const timeLabels: { x: number; label: string }[] = []
  const step = zoom === 'day' ? 1 : zoom === 'week' ? 7 : 30
  for (let d = new Date(minDate); d <= maxDate; d = new Date(d.getTime() + step * DAY_MS)) {
    timeLabels.push({ x: dateToX(d), label: formatDate(d) })
  }

  // Today line
  const todayX = dateToX(today)

  // Compute critical path (simplified: tasks with no slack)
  const criticalTaskIds = new Set<string>()
  if (tasks.length > 0 && dependencies.length > 0) {
    // Forward pass: find latest path
    const taskMap = new Map(tasks.map(t => [t.id, t]))
    const successors = new Map<string, string[]>()
    for (const dep of dependencies) {
      const list = successors.get(dep.predecessor_id) || []
      list.push(dep.successor_id)
      successors.set(dep.predecessor_id, list)
    }
    // Find tasks that are on the longest chain ending at the latest task
    const latestTask = tasks.reduce((a, b) => new Date(a.end_date) > new Date(b.end_date) ? a : b)
    criticalTaskIds.add(latestTask.id)
    // Trace predecessors
    const predecessorMap = new Map<string, string[]>()
    for (const dep of dependencies) {
      const list = predecessorMap.get(dep.successor_id) || []
      list.push(dep.predecessor_id)
      predecessorMap.set(dep.successor_id, list)
    }
    function traceCritical(taskId: string) {
      const preds = predecessorMap.get(taskId) || []
      if (preds.length > 0) {
        const latestPred = preds.reduce((a, b) => {
          const ta = taskMap.get(a), tb = taskMap.get(b)
          return ta && tb && new Date(ta.end_date) > new Date(tb.end_date) ? a : b
        })
        criticalTaskIds.add(latestPred)
        traceCritical(latestPred)
      }
    }
    traceCritical(latestTask.id)
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-100 rounded w-64" />
        <div className="h-96 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={syncPhases}>
            <RefreshCw className="w-4 h-4 mr-2" />Sync from Phases
          </Button>
          <Button variant="outline" onClick={() => setShowDepModal(true)}>
            <Link2 className="w-4 h-4 mr-2" />Add Dependency
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['day', 'week', 'month'] as ZoomLevel[]).map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${zoom === z ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {z}
              </button>
            ))}
          </div>
          <Button onClick={() => { setEditTask(null); setShowTaskModal(true) }}>
            <Plus className="w-4 h-4 mr-2" />Add Task
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Diamond className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No schedule tasks yet</h3>
          <p className="text-sm text-gray-500 mb-4">Add tasks manually or sync from your project phases</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={syncPhases}><RefreshCw className="w-4 h-4 mr-2" />Sync from Phases</Button>
            <Button onClick={() => setShowTaskModal(true)}><Plus className="w-4 h-4 mr-2" />Add Task</Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto">
            {/* Sidebar — task list */}
            <div className="hidden md:block shrink-0 border-r border-gray-200 bg-gray-50" style={{ width: sidebarWidth }}>
              <div className="h-[50px] px-3 flex items-center border-b border-gray-200">
                <span className="text-xs font-medium text-gray-500 uppercase">Task Name</span>
              </div>
              {tasks.map((task, i) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-3 border-b border-gray-100 hover:bg-gray-100 group cursor-pointer"
                  style={{ height: rowHeight }}
                  onClick={() => { setEditTask(task); setShowTaskModal(true) }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {task.is_milestone ? (
                      <Diamond className="w-3 h-3 text-amber-500 shrink-0" />
                    ) : (
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: task.color || TASK_COLORS[i % TASK_COLORS.length] }} />
                    )}
                    <span className="text-sm text-gray-900 truncate">{task.name}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div className="flex-1 overflow-x-auto">
              <svg width={chartWidth} height={chartHeight} ref={svgRef} className="block">
                {/* Time axis */}
                <g>
                  {timeLabels.map((l, i) => (
                    <g key={i}>
                      <line x1={l.x} y1={0} x2={l.x} y2={chartHeight} stroke="#f1f5f9" strokeWidth={1} />
                      <text x={l.x + 4} y={20} fill="#94a3b8" fontSize={11}>{l.label}</text>
                    </g>
                  ))}
                  <line x1={0} y1={headerHeight} x2={chartWidth} y2={headerHeight} stroke="#e2e8f0" strokeWidth={1} />
                </g>

                {/* Today line */}
                <line x1={todayX} y1={0} x2={todayX} y2={chartHeight} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,4" />
                <text x={todayX + 4} y={38} fill="#ef4444" fontSize={10} fontWeight="bold">Today</text>

                {/* Task bars */}
                {tasks.map((task, i) => {
                  const x = dateToX(task.start_date)
                  const w = dateToX(task.end_date) - x
                  const y = headerHeight + i * rowHeight + 6
                  const barHeight = rowHeight - 12
                  const color = task.color || TASK_COLORS[i % TASK_COLORS.length]
                  const isCritical = criticalTaskIds.has(task.id)

                  if (task.is_milestone) {
                    return (
                      <g key={task.id}>
                        <polygon
                          points={`${x},${y + barHeight / 2} ${x + 8},${y} ${x + 16},${y + barHeight / 2} ${x + 8},${y + barHeight}`}
                          fill="#d97706"
                          stroke={isCritical ? '#dc2626' : '#92400e'}
                          strokeWidth={isCritical ? 2 : 1}
                        />
                      </g>
                    )
                  }

                  return (
                    <g key={task.id}>
                      {/* Background bar */}
                      <rect
                        x={x} y={y} width={Math.max(w, 4)} height={barHeight}
                        rx={4} fill={color} opacity={0.2}
                        stroke={isCritical ? '#dc2626' : 'none'} strokeWidth={2}
                      />
                      {/* Progress bar */}
                      <rect
                        x={x} y={y} width={Math.max(w * (task.progress / 100), 0)} height={barHeight}
                        rx={4} fill={color} opacity={0.8}
                      />
                      {/* Label */}
                      {w > 60 && (
                        <text x={x + 6} y={y + barHeight / 2 + 4} fill="white" fontSize={11} fontWeight="500">
                          {task.progress > 0 ? `${task.progress}%` : ''}
                        </text>
                      )}
                      {/* Dates */}
                      <text x={x} y={y + barHeight + 10} fill="#94a3b8" fontSize={9}>
                        {task.start_date} → {task.end_date}
                      </text>
                    </g>
                  )
                })}

                {/* Dependency arrows */}
                {dependencies.map(dep => {
                  const predIdx = tasks.findIndex(t => t.id === dep.predecessor_id)
                  const succIdx = tasks.findIndex(t => t.id === dep.successor_id)
                  if (predIdx === -1 || succIdx === -1) return null

                  const pred = tasks[predIdx]
                  const succ = tasks[succIdx]
                  const x1 = dateToX(pred.end_date)
                  const y1 = headerHeight + predIdx * rowHeight + rowHeight / 2
                  const x2 = dateToX(succ.start_date)
                  const y2 = headerHeight + succIdx * rowHeight + rowHeight / 2

                  const midX = x1 + (x2 - x1) / 2

                  return (
                    <g key={dep.id}>
                      <path
                        d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`}
                        fill="none" stroke="#94a3b8" strokeWidth={1.5}
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  )
                })}

                {/* Arrow marker */}
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          projectId={projectId}
          task={editTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null) }}
          onSaved={() => { setShowTaskModal(false); setEditTask(null); fetchGantt() }}
        />
      )}

      {/* Dependency Modal */}
      {showDepModal && (
        <DependencyModal
          projectId={projectId}
          tasks={tasks}
          onClose={() => setShowDepModal(false)}
          onSaved={() => { setShowDepModal(false); fetchGantt() }}
        />
      )}
    </div>
  )
}

function TaskModal({ projectId, task, onClose, onSaved }: { projectId: string; task: GanttTask | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: task?.name || '',
    start_date: task?.start_date || new Date().toISOString().split('T')[0],
    end_date: task?.end_date || new Date(Date.now() + 7 * DAY_MS).toISOString().split('T')[0],
    progress: task?.progress?.toString() || '0',
    is_milestone: task?.is_milestone || false,
    color: task?.color || '',
    notes: task?.notes || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      progress: parseInt(form.progress) || 0,
      is_milestone: form.is_milestone,
      color: form.color || undefined,
      notes: form.notes || undefined,
      ...(task ? { task_id: task.id } : {}),
    }

    const res = await fetch(`/api/projects/${projectId}/gantt/tasks`, {
      method: task ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      toast.success(task ? 'Task updated' : 'Task created')
      onSaved()
    }
    setSaving(false)
  }

  return (
    <Dialog open onClose={onClose} title={task ? 'Edit Task' : 'Add Task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label required>Task Name</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Start Date</Label>
            <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
          </div>
          <div>
            <Label required>End Date</Label>
            <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Progress (%)</Label>
            <Input type="number" min="0" max="100" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))} />
          </div>
          <div>
            <Label>Color</Label>
            <Input type="color" value={form.color || '#2563eb'} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-10" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_milestone} onChange={e => setForm(f => ({ ...f, is_milestone: e.target.checked }))} className="rounded" />
          This is a milestone
        </label>
        <div>
          <Label>Notes</Label>
          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.name}>{saving ? 'Saving...' : task ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Dialog>
  )
}

function DependencyModal({ projectId, tasks, onClose, onSaved }: { projectId: string; tasks: GanttTask[]; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ predecessor_id: '', successor_id: '', dependency_type: 'FS', lag_days: '0' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/projects/${projectId}/gantt/dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, lag_days: parseInt(form.lag_days) || 0 }),
    })
    if (res.ok) { toast.success('Dependency added'); onSaved() }
    else { const err = await res.json(); toast.error(err.error || 'Failed') }
    setSaving(false)
  }

  const taskOptions = tasks.map(t => ({ value: t.id, label: t.name }))

  return (
    <Dialog open onClose={onClose} title="Add Dependency">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label required>Predecessor (must finish first)</Label>
          <Select value={form.predecessor_id} onChange={e => setForm(f => ({ ...f, predecessor_id: e.target.value }))} options={[{ value: '', label: 'Select task...' }, ...taskOptions]} />
        </div>
        <div>
          <Label required>Successor (starts after)</Label>
          <Select value={form.successor_id} onChange={e => setForm(f => ({ ...f, successor_id: e.target.value }))} options={[{ value: '', label: 'Select task...' }, ...taskOptions]} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <Select value={form.dependency_type} onChange={e => setForm(f => ({ ...f, dependency_type: e.target.value }))} options={[
              { value: 'FS', label: 'Finish-to-Start' },
              { value: 'FF', label: 'Finish-to-Finish' },
              { value: 'SS', label: 'Start-to-Start' },
              { value: 'SF', label: 'Start-to-Finish' },
            ]} />
          </div>
          <div>
            <Label>Lag (days)</Label>
            <Input type="number" value={form.lag_days} onChange={e => setForm(f => ({ ...f, lag_days: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.predecessor_id || !form.successor_id}>{saving ? 'Adding...' : 'Add'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
