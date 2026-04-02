'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const JobMap = dynamic(
  () => import('@/components/maps/job-map').then(m => ({ default: m.JobMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">
        Loading map...
      </div>
    ),
  }
)

interface Job {
  id: string
  title: string
  status: string
  address_line1?: string
  city?: string
  state?: string
  zip?: string
  coordinates?: { lat: number; lng: number } | string
  scheduled_start?: string
  customer?: { first_name?: string; last_name?: string; company_name?: string }
  assignee?: { first_name?: string; last_name?: string }
}

export function DashboardJobMap({ jobs }: { jobs: Job[] }) {
  const [mapJobs, setMapJobs] = useState<any[]>([])

  useEffect(() => {
    async function geocodeJobs() {
      const results = []
      for (const job of jobs) {
        let coords: { lat: number; lng: number } | null = null
        if (job.coordinates) {
          const c = typeof job.coordinates === 'string' ? JSON.parse(job.coordinates) : job.coordinates
          if (c?.lat && c?.lng) coords = { lat: Number(c.lat), lng: Number(c.lng) }
        }

        if (coords) {
          results.push({
            id: job.id,
            title: job.title,
            status: job.status,
            lat: coords.lat,
            lng: coords.lng,
            address: [job.address_line1, job.city, job.state].filter(Boolean).join(', '),
            customer_name: job.customer?.company_name ?? (job.customer?.first_name ? `${job.customer.first_name} ${job.customer.last_name}` : ''),
            scheduled_start: job.scheduled_start,
            assignee_name: job.assignee ? `${job.assignee.first_name} ${job.assignee.last_name}` : '',
          })
          continue
        }

        const address = [job.address_line1, job.city, job.state, job.zip].filter(Boolean).join(', ')
        if (!address) continue

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: address, format: 'json', limit: '1' })}`,
            { headers: { 'User-Agent': 'ServiceOfficial/1.0' } }
          )
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
          await new Promise(r => setTimeout(r, 1100))
        } catch {}
      }
      setMapJobs(results)
    }

    geocodeJobs()
  }, [jobs])

  if (mapJobs.length === 0 && jobs.length > 0) {
    return (
      <div className="h-[350px] bg-gray-50 rounded-xl flex items-center justify-center text-sm text-gray-400">
        Geocoding job locations...
      </div>
    )
  }

  return <JobMap jobs={mapJobs} height="350px" type="jobs" />
}
