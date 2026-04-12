'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogClose, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Plus, Trash2, FileText, PieChart
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart as RechartsPie, Pie, Cell
} from 'recharts'
import type { BudgetSummary, BudgetCategoryType } from '@service-official/types'

const CATEGORY_TYPES: { value: BudgetCategoryType; label: string }[] = [
  { value: 'materials', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'permits', label: 'Permits' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'contingency', label: 'Contingency' },
  { value: 'other', label: 'Other' },
]

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#65a30d', '#6b7280']

export default function BudgetPage({ params }: { params: { id: string } }) {
  const projectId = params.id
  const [budget, setBudget] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => { fetchBudget() }, [projectId])

  async function fetchBudget() {
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/budget`)
    const json = await res.json()
    setBudget(json.data)
    setLoading(false)
  }

  async function handleDeleteCategory(categoryId: string) {
    const res = await fetch(`/api/projects/${projectId}/budget/categories?category_id=${categoryId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Category deleted')
      fetchBudget()
    }
  }

  async function handleImportFromEstimate() {
    // Fetch project estimates
    const estRes = await fetch(`/api/estimates?project_id=${projectId}&status=approved`)
    const estData = await estRes.json()
    const estimates = estData.data || []

    if (estimates.length === 0) {
      toast.error('No approved estimates found for this project')
      return
    }

    const res = await fetch(`/api/projects/${projectId}/budget/from-estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimate_id: estimates[0].id }),
    })

    if (res.ok) {
      const data = await res.json()
      toast.success(`Imported ${data.count} budget categories from estimate`)
      fetchBudget()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to import')
    }
  }

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  const hasCategories = budget && budget.categories.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Project Budget</h2>
        <div className="flex gap-2">
          {!hasCategories && (
            <Button variant="outline" onClick={handleImportFromEstimate}>
              <FileText className="w-4 h-4 mr-2" />
              Import from Estimate
            </Button>
          )}
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {!hasCategories ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No budget set up yet</h3>
          <p className="text-sm text-gray-500 mb-4">Add budget categories or import from an approved estimate</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleImportFromEstimate}>
              <FileText className="w-4 h-4 mr-2" />
              Import from Estimate
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Total Budget" value={fmt(budget!.total_budget)} icon={DollarSign} />
            <SummaryCard label="Spent" value={fmt(budget!.total_actual)} icon={TrendingDown} color={budget!.total_actual > budget!.total_budget ? 'text-red-600' : 'text-blue-600'} />
            <SummaryCard label="Remaining" value={fmt(budget!.total_variance)} icon={budget!.total_variance >= 0 ? TrendingUp : AlertTriangle} color={budget!.total_variance >= 0 ? 'text-emerald-600' : 'text-red-600'} />
            <SummaryCard label="Forecast" value={fmt(budget!.forecast_at_completion)} icon={PieChart} color={budget!.estimated_over_under >= 0 ? 'text-emerald-600' : 'text-red-600'} subtitle={budget!.estimated_over_under >= 0 ? `${fmt(budget!.estimated_over_under)} under` : `${fmt(Math.abs(budget!.estimated_over_under))} over`} />
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Budget Used</span>
              <span className="text-sm font-medium text-gray-900">{budget!.percent_used.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  budget!.percent_used > 100 ? 'bg-red-500' : budget!.percent_used > 90 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(budget!.percent_used, 100)}%` }}
              />
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Budget vs Actual</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budget!.categories.map(c => ({
                  name: c.name.length > 12 ? c.name.substring(0, 12) + '...' : c.name,
                  Budget: c.budgeted_amount,
                  Actual: c.actual_amount,
                }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Budget" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Budget Allocation</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={budget!.categories.map(c => ({ name: c.name, value: c.budgeted_amount }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {budget!.categories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categories Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Budgeted</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actual</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Variance</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">% Used</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {budget!.categories.map(cat => {
                  const overBudget = cat.variance < 0
                  const nearBudget = cat.percent_used >= 90 && !overBudget
                  return (
                    <tr key={cat.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{cat.type}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(cat.budgeted_amount)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(cat.actual_amount)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${overBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                        {overBudget ? '-' : '+'}{fmt(Math.abs(cat.variance))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          overBudget ? 'bg-red-100 text-red-700' : nearBudget ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {cat.percent_used.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-50 font-medium">
                  <td className="px-4 py-3 text-gray-900">Total</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right text-gray-900">{fmt(budget!.total_budget)}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{fmt(budget!.total_actual)}</td>
                  <td className={`px-4 py-3 text-right ${budget!.total_variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {budget!.total_variance >= 0 ? '+' : '-'}{fmt(Math.abs(budget!.total_variance))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      budget!.percent_used > 100 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {budget!.percent_used.toFixed(0)}%
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <AddCategoryModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetchBudget() }}
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color = 'text-gray-900', subtitle }: {
  label: string; value: string; icon: any; color?: string; subtitle?: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function AddCategoryModal({ projectId, onClose, onSaved }: { projectId: string; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'materials' as BudgetCategoryType, budgeted_amount: '', description: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/projects/${projectId}/budget/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        budgeted_amount: parseFloat(form.budgeted_amount) || 0,
        description: form.description || undefined,
      }),
    })
    if (res.ok) {
      toast.success('Budget category added')
      onSaved()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Failed to add category')
    }
    setSaving(false)
  }

  return (
    <Dialog open onClose={onClose}>
      <DialogClose onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Add Budget Category</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div>
            <Label required>Category Name</Label>
            <Input placeholder="e.g. Roofing Materials" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <Label required>Type</Label>
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as BudgetCategoryType }))} options={CATEGORY_TYPES} />
          </div>
          <div>
            <Label required>Budgeted Amount ($)</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={form.budgeted_amount} onChange={e => setForm(f => ({ ...f, budgeted_amount: e.target.value }))} required />
          </div>
          <div>
            <Label>Description</Label>
            <Input placeholder="Optional description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.name}>{saving ? 'Adding...' : 'Add Category'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
