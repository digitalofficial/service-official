'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'

const ALL_ROLES = ['owner', 'admin', 'office_manager', 'project_manager', 'foreman', 'technician', 'dispatcher', 'subcontractor', 'viewer']
const DISPLAY_ROLES = ['owner', 'office_manager', 'project_manager', 'foreman', 'technician', 'dispatcher', 'subcontractor', 'viewer']

const STATIC_PERMISSIONS = [
  { label: 'View projects', roles: ['owner', 'admin', 'office_manager', 'estimator', 'project_manager', 'foreman', 'technician', 'dispatcher', 'subcontractor', 'viewer'] },
  { label: 'Create projects', roles: ['owner', 'admin', 'office_manager', 'estimator', 'project_manager'] },
  { label: 'Delete projects', roles: ['owner', 'admin'] },
  { label: 'View customers', roles: ['owner', 'admin', 'office_manager', 'estimator', 'project_manager', 'dispatcher'] },
  { label: 'Manage customers', roles: ['owner', 'admin', 'office_manager'] },
  { label: 'Create estimates', roles: ['owner', 'admin'] },
  { label: 'Send estimates', roles: ['owner', 'admin', 'office_manager'] },
  { label: 'Create invoices', roles: ['owner', 'admin', 'office_manager'] },
  { label: 'View financials', roles: ['owner', 'admin', 'office_manager'] },
  { label: 'Manage jobs', roles: ['owner', 'admin', 'office_manager', 'project_manager', 'dispatcher'] },
  { label: 'Submit daily logs', roles: ['owner', 'admin', 'project_manager', 'foreman', 'technician'] },
  { label: 'Manage team', roles: ['owner', 'admin'] },
  { label: 'Manage settings', roles: ['owner', 'admin'] },
  { label: 'Manage billing', roles: ['owner'] },
]

export default function PermissionsPage() {
  const [exportRoles, setExportRoles] = useState<string[]>(['owner', 'admin'])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings/export-permissions')
      .then(r => r.json())
      .then(data => { if (data.roles) setExportRoles(data.roles) })
      .catch(() => {})
  }, [])

  function toggleExportRole(role: string) {
    // Owner always has export
    if (role === 'owner') return
    setExportRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
    setSaved(false)
  }

  async function saveExportPermissions() {
    setSaving(true)
    try {
      await fetch('/api/settings/export-permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: exportRoles }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Role Permissions</h2>
        <p className="text-xs text-gray-500">Configure what each role can access</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left font-medium text-gray-500 px-3 py-2.5 sticky left-0 bg-gray-50/50 min-w-[160px]">Permission</th>
              {DISPLAY_ROLES.map((role) => (
                <th key={role} className="text-center font-medium text-gray-500 px-2 py-2.5 capitalize min-w-[80px]">
                  {role.replace('_', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {STATIC_PERMISSIONS.map((perm) => (
              <tr key={perm.label} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-700 font-medium sticky left-0 bg-white">{perm.label}</td>
                {DISPLAY_ROLES.map((role) => (
                  <td key={role} className="text-center px-2 py-2.5">
                    <input
                      type="checkbox"
                      defaultChecked={perm.roles.includes(role)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={role === 'owner'}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {/* Export data — functional toggle */}
            <tr className="hover:bg-gray-50 bg-blue-50/30">
              <td className="px-3 py-2.5 text-gray-700 font-medium sticky left-0 bg-blue-50/30">
                Export data
                <span className="block text-[10px] text-gray-400 font-normal">Download CSV exports</span>
              </td>
              {DISPLAY_ROLES.map((role) => (
                <td key={role} className="text-center px-2 py-2.5">
                  <input
                    type="checkbox"
                    checked={exportRoles.includes(role)}
                    onChange={() => toggleExportRole(role)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={role === 'owner'}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveExportPermissions} disabled={saving}>
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
          ) : saved ? (
            <><Check className="w-4 h-4 mr-2" />Saved</>
          ) : (
            'Save Permissions'
          )}
        </Button>
      </div>
    </div>
  )
}
