'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  orgId: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  orgName: string
}

export function BrandingForm({ orgId, logoUrl, primaryColor, secondaryColor, orgName }: Props) {
  const router = useRouter()
  const [logo, setLogo] = useState(logoUrl ?? '')
  const [primary, setPrimary] = useState(primaryColor)
  const [secondary, setSecondary] = useState(secondaryColor)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('file_type', 'image')
      formData.append('description', 'Company logo')

      const res = await fetch('/api/files', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { data } = await res.json()
      setLogo(data.public_url)
      toast.success('Logo uploaded — click Save to apply')
    } catch {
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: logo || null,
          primary_color: primary,
          secondary_color: secondary,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Branding saved')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {/* Logo */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Company Logo</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              'No logo'
            )}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </button>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, or SVG. Max 2MB.</p>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Primary Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primary}
              onChange={e => setPrimary(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={primary}
              onChange={e => setPrimary(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-32 uppercase"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Secondary Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondary}
              onChange={e => setSecondary(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={secondary}
              onChange={e => setSecondary(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-32 uppercase"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-gray-100">
        <label className="text-sm font-medium text-gray-700 block mb-3">Preview</label>
        <div className="bg-gray-50 rounded-lg p-6 flex items-center gap-4">
          {logo ? (
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primary }}>
              {orgName[0]}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{orgName}</p>
            <p className="text-xs text-gray-500">How your brand appears to customers</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}
