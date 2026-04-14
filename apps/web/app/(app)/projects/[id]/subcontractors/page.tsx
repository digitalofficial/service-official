import { getProfile } from '@/lib/auth/get-profile'
import { EmptyState } from '@/components/ui/empty-state'
import { HardHat } from 'lucide-react'
import { ProjectSubsClient } from './subs-client'

export const dynamic = 'force-dynamic'

export default async function ProjectSubcontractorsPage({ params }: { params: { id: string } }) {
  const { profile, supabase } = await getProfile()

  const [{ data: assignments }, { data: subs }] = await Promise.all([
    supabase
      .from('project_subcontractors')
      .select('*, subcontractor:subcontractors(id, company_name, contact_name, email, phone, trade, insurance_expiry, general_liability_expiry, workers_comp_expiry)')
      .eq('project_id', params.id)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('subcontractors')
      .select('id, company_name, trade')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('company_name'),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Subcontractors ({assignments?.length ?? 0})</h2>
      </div>

      {(!assignments || assignments.length === 0) ? (
        <EmptyState
          icon={<HardHat className="w-10 h-10" />}
          title="No subcontractors assigned"
          description="Assign a subcontractor to this project to track their scope, schedule, hours, and insurance."
        />
      ) : null}

      <ProjectSubsClient
        projectId={params.id}
        initialAssignments={assignments ?? []}
        availableSubs={subs ?? []}
      />
    </div>
  )
}
