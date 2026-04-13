'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Plus, Download, Pencil, Trash2, Loader2, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface Account {
  id: string
  account_number: string
  name: string
  type: string
  subtype: string | null
  parent_id: string | null
  description: string | null
  is_active: boolean
}

const ACCOUNT_TYPES = [
  { label: 'Asset', value: 'asset' },
  { label: 'Liability', value: 'liability' },
  { label: 'Equity', value: 'equity' },
  { label: 'Revenue', value: 'revenue' },
  { label: 'Expense', value: 'expense' },
]

const TYPE_LABELS: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
}

const TYPE_COLORS: Record<string, string> = {
  asset: 'text-blue-700 bg-blue-50 border-blue-200',
  liability: 'text-red-700 bg-red-50 border-red-200',
  equity: 'text-purple-700 bg-purple-50 border-purple-200',
  revenue: 'text-green-700 bg-green-50 border-green-200',
  expense: 'text-orange-700 bg-orange-50 border-orange-200',
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => { fetchAccounts() }, [])

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/accounts')
      if (res.ok) {
        const { data } = await res.json()
        setAccounts(data || [])
      }
    } catch {
      toast.error('Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData(e.currentTarget)
      const body = {
        account_number: fd.get('account_number'),
        name: fd.get('name'),
        type: fd.get('type'),
        subtype: fd.get('subtype') || null,
        description: fd.get('description') || null,
      }

      const isEdit = !!editingAccount
      const url = isEdit ? `/api/accounts/${editingAccount.id}` : '/api/accounts'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to save')
        return
      }

      toast.success(isEdit ? 'Account updated' : 'Account created')
      setShowAdd(false)
      setEditingAccount(null)
      fetchAccounts()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this account?')) return

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to delete')
        return
      }
      toast.success('Account deleted')
      fetchAccounts()
    } catch {
      toast.error('Something went wrong')
    }
  }

  async function handleLoadStandard() {
    setSeeding(true)
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: true }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to load standard chart')
        return
      }

      toast.success('Standard construction chart of accounts loaded')
      fetchAccounts()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSeeding(false)
    }
  }

  async function handleToggleActive(account: Account) {
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !account.is_active }),
      })
      if (res.ok) {
        fetchAccounts()
      }
    } catch {
      toast.error('Failed to update')
    }
  }

  function toggleGroup(type: string) {
    setCollapsed(prev => ({ ...prev, [type]: !prev[type] }))
  }

  // Group accounts by type
  const grouped = ['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => ({
    type,
    label: TYPE_LABELS[type],
    accounts: accounts.filter(a => a.type === type),
  })).filter(g => g.accounts.length > 0)

  const showDialog = showAdd || !!editingAccount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Chart of Accounts</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleLoadStandard} disabled={seeding}>
            {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
            Load Standard Construction Chart
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" />Add Account
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          title="No accounts"
          description="Add accounts manually or load the standard construction chart of accounts."
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(({ type, label, accounts: groupAccounts }) => (
            <div key={type} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleGroup(type)}
                className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 ${TYPE_COLORS[type]}`}
              >
                <div className="flex items-center gap-2">
                  {collapsed[type] ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-xs opacity-70">({groupAccounts.length})</span>
                </div>
              </button>

              {!collapsed[type] && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Account #</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Name</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs hidden sm:table-cell">Subtype</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Status</th>
                      <th className="w-20 px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {groupAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-mono font-medium text-gray-900">{account.account_number}</td>
                        <td className="px-4 py-2.5 text-gray-900">{account.name}</td>
                        <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{account.subtype ?? '-'}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => handleToggleActive(account)}>
                            <Badge variant={account.is_active ? 'success' : 'secondary'}>
                              {account.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingAccount(account)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(account.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onClose={() => { setShowAdd(false); setEditingAccount(null) }}>
        <DialogClose onClose={() => { setShowAdd(false); setEditingAccount(null) }} />
        <DialogHeader>
          <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="acct-number" required>Account Number</Label>
                <Input id="acct-number" name="account_number" placeholder="1000" defaultValue={editingAccount?.account_number ?? ''} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acct-type" required>Type</Label>
                <Select id="acct-type" name="type" options={ACCOUNT_TYPES} defaultValue={editingAccount?.type ?? 'asset'} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acct-name" required>Name</Label>
              <Input id="acct-name" name="name" placeholder="Cash" defaultValue={editingAccount?.name ?? ''} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="acct-subtype">Subtype</Label>
                <Input id="acct-subtype" name="subtype" placeholder="Current Asset" defaultValue={editingAccount?.subtype ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acct-desc">Description</Label>
                <Input id="acct-desc" name="description" placeholder="Optional" defaultValue={editingAccount?.description ?? ''} />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingAccount(null) }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingAccount ? 'Save Changes' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
