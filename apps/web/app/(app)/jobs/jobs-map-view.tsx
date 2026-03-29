'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Dynamic import to avoid SSR issues with Leaflet
const JobMap = dynamic(() => import('@/components/maps/job-map').then(m => ({ default: m.JobMap })), {
  ssr: false,
  loading: () => <div className="h-[500px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">Loading map...</div>,
})

interface Job {
  id: string
  title: string
  status: string
  address_line1?: string
  city?: string
  state?: string
  zip?: string
  coordinates?: { lat: number; lng: number }
  scheduled_start?: string
  customer?: { first_name?: string; last_name?: string; company_name?: string }
  assignee?: { first_name?: string; last_name?: string }
}

export function JobsMapView({ jobs }: { jobs: Job[] }) {
  const [mapJobs, setMapJobs] = useState<any[]>([])

  useEffect(() => {
    async function geocodeJobs() {
      const results = []
      for (const job of jobs) {
        // Use existing coordinates if available
        if (job.coordinates?.lat && job.coordinates?.lng) {
          results.push({
            id: job.id,
            title: job.title,
            status: job.status,
            lat: job.coordinates.lat,
            lng: job.coordinates.lng,
            address: [job.address_line1, job.city, job.state].filter(Boolean).join(', '),
            customer_name: job.customer?.company_name ?? (job.customer?.first_name ? `${job.customer.first_name} ${job.customer.last_name}` : ''),
            scheduled_start: job.scheduled_start,
            assignee_name: job.assignee ? `${job.assignee.first_name} ${job.assignee.last_name}` : '',
          })
          continue
        }

        // Geocode from address
        const address = [job.address_line1, job.city, job.state, job.zip].filter(Boolean).join(', ')
        if (!address) continue

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: address, format: 'json', limit: '1' })}`, {
            headers: { 'User-Agent': 'ServiceOfficial/1.0' },
          })
          const data = await res.json()
          if (data.length > 0) {
            results.push({
              id: job.id,
              title: job.title,
              status: job.status,
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              address,
              customer_name: job.customer?.company_name ?? (job.customer?.first_name ? `${job.customer.first_name} ${job.customer.last_name}` : ''),
              scheduled_start: job.scheduled_start,
              assignee_name: job.assignee ? `${job.assignee.first_name} ${job.assignee.last_name}` : '',
            })
          }
          // Rate limit: 1 req/sec for Nominatim
          await new Promise(r => setTimeout(r, 1100))
        } catch {}
      }
      setMapJobs(results)
    }

    geocodeJobs()
  }, [jobs])

  return (
    <div>
      {mapJobs.length === 0 && jobs.length > 0 ? (
        <div className="h-[500px] bg-gray-50 rounded-xl flex items-center justify-center text-sm text-gray-400">
          Geocoding job locations...
        </div>
      ) : (
        <JobMap jobs={mapJobs} height="500px" type="jobs" />
      )}
      <p className="text-xs text-gray-400 mt-2">
        {mapJobs.length} of {jobs.length} jobs mapped — double-click a pin to open the job
      </p>
    </div>
  )
}
