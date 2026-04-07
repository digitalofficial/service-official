import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Permissions' }

const ROLES = ['owner', 'office_manager', 'estimator', 'project_manager', 'foreman', 'technician', 'dispatcher', 'subcontractor', 'viewer']

const PERMISSIONS = [
  { label: 'View projects', roles: ['owner', 'admin', 'office_manager', 'estimator', 'project_manager', 'foreman', 'technician', 'dispatcher', 'subcontractor', 'viewer'] },
  { label: 'Create projects', roles: ['owner', 'admin', 'office_manager', 'estimator', 'project_manager'] },
  { label: 'Delete projects', roles: ['owner', 'admin'] },
  { label: 'View customers', roles: ['owner', 'admin', 'office_manager', 'estimator', 'project_manager', 'dispatcher'] },
  { label: 'Manage customers', roles: ['owner', 'admin', 'office_manager'] },
  { label: 'Create estimates', roles: ['owner', 'admin', 'estimator'] },
  { label: 'Send estimates', roles: ['owner', 'admin', 'office_manager', 'estimator'] },
  { label: 'Create invoices', roles: ['owner', 'admin', 'office_manager'] },
  { label: 'View financials', roles: ['owner', 'admin', 'office_manager'] },
  { label: 'Manage jobs', roles: ['owner', 'admin', 'office_manager', 'project_manager', 'dispatcher'] },
  { label: 'Submit daily logs', roles: ['owner', 'admin', 'project_manager', 'foreman', 'technician'] },
  { label: 'Manage team', roles: ['owner', 'admin'] },
  { label: 'Manage settings', roles: ['owner', 'admin'] },
  { label: 'Manage billing', roles: ['owner'] },
]

export default function PermissionsPage() {
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
              {ROLES.map((role) => (
                <th key={role} className="text-center font-medium text-gray-500 px-2 py-2.5 capitalize min-w-[80px]">
                  {role.replace('_', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PERMISSIONS.map((perm) => (
              <tr key={perm.label} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 text-gray-700 font-medium sticky left-0 bg-white">{perm.label}</td>
                {ROLES.map((role) => (
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
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button>Save Permissions</Button>
      </div>
    </div>
  )
}
