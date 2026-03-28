import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Branding Settings' }

export default async function BrandingPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization:organizations(name, logo_url, primary_color, secondary_color)')
    .eq('id', user!.id)
    .single()

  const org = (profile as any)?.organization

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Branding</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Logo */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Company Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
              {org?.logo_url ? (
                <img src={org.logo_url} alt="Logo" className="w-full h-full object-contain rounded-xl" />
              ) : (
                'No logo'
              )}
            </div>
            <div>
              <Button variant="outline" size="sm">Upload Logo</Button>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, or SVG. Max 2MB.</p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: org?.primary_color ?? '#2563eb' }} />
              <input
                type="text"
                defaultValue={org?.primary_color ?? '#2563eb'}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-32"
                readOnly
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Secondary Color</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: org?.secondary_color ?? '#1e3a5f' }} />
              <input
                type="text"
                defaultValue={org?.secondary_color ?? '#1e3a5f'}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-32"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="pt-4 border-t border-gray-100">
          <label className="text-sm font-medium text-gray-700 block mb-3">Preview</label>
          <div className="bg-gray-50 rounded-lg p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: org?.primary_color ?? '#2563eb' }}>
              {org?.name?.[0] ?? 'S'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{org?.name ?? 'Your Company'}</p>
              <p className="text-xs text-gray-500">How your brand appears to customers</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
