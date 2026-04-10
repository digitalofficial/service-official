'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ReportTabs, type TabKey } from './report-tabs'
import { ReportLibrary } from './report-library'
import { ReportViewer } from './report-viewer'
import { CustomBuilder } from './custom-builder'
import { SavedReportsList } from './saved-reports-list'

interface Props {
  dashboardContent: React.ReactNode
}

function ReportsClientInner({ dashboardContent }: Props) {
  const searchParams = useSearchParams()
  const tab = (searchParams.get('tab') ?? 'dashboard') as TabKey
  const slug = searchParams.get('slug')

  return (
    <div className="space-y-6">
      <ReportTabs activeTab={tab} />

      {tab === 'dashboard' && dashboardContent}

      {tab === 'library' && (
        slug ? <ReportViewer slug={slug} /> : <ReportLibrary />
      )}

      {tab === 'builder' && <CustomBuilder />}

      {tab === 'saved' && <SavedReportsList />}
    </div>
  )
}

export function ReportsClient({ dashboardContent }: Props) {
  return (
    <Suspense>
      <ReportsClientInner dashboardContent={dashboardContent} />
    </Suspense>
  )
}
