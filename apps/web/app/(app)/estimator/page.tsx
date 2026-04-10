import { getProfile } from '@/lib/auth/get-profile'
import { PageHeader } from '@/components/ui/page-header'
import { EstimatorTabs } from './estimator-tabs'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Estimator' }

export default async function EstimatorPage() {
  const { supabase, profile } = await getProfile()

  const { data: orgData } = await supabase
    .from('organizations')
    .select('name, industry')
    .eq('id', profile.organization_id)
    .single()

  const orgId = profile.organization_id

  // Fetch recent takeoffs
  const { data: takeoffs } = await supabase
    .from('takeoffs')
    .select(`
      *,
      blueprint:blueprints(id, name),
      project:projects(id, name),
      reviewer:profiles!reviewed_by(first_name, last_name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch blueprints
  const { data: blueprints } = await supabase
    .from('blueprints')
    .select(`
      *,
      project:projects(id, name),
      uploader:profiles!uploaded_by(first_name, last_name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20)

  const org = orgData

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estimator"
        description="AI-powered material takeoffs and cost estimates"
      />
      <EstimatorTabs
        takeoffs={takeoffs ?? []}
        blueprints={blueprints ?? []}
        userName={profile?.first_name ?? 'there'}
        orgIndustry={org?.industry ?? 'general_contractor'}
      />
    </div>
  )
}
