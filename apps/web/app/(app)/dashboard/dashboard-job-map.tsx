'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useMemo } from 'react'

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

interface OrgAddress {
  name: string
  address: string
}

function parseCoords(coords: any): { lat: number; lng: number } | null {
  if (!coords) return null
  const c = typeof coords === 'string' ? JSON.parse(coords) : coords
  if (c?.lat && c?.lng) return { lat: Number(c.lat), lng: Number(c.lng) }
  return null
}

function formatJob(job: Job, lat: number, lng: number) {
  return {
    id: job.id,
    title: job.title,
    status: job.status,
    lat,
    lng,
    address: [job.address_line1, job.city, job.state].filter(Boolean).join(', '),
    customer_name: job.customer?.company_name || (job.customer?.first_name ? `${job.customer.first_name} ${job.customer.last_name}` : ''),
    scheduled_start: job.scheduled_start,
    assignee_name: job.assignee ? `${job.assignee.first_name} ${job.assignee.last_name}` : '',
  }
}

export function DashboardJobMap({ jobs, orgAddress }: { jobs: Job[]; orgAddress?: OrgAddress | null }) {
  // Immediately map jobs that already have coordinates (no geocoding needed)
  const jobsWithCoords = useMemo(() => {
    const results = []
    for (const job of jobs) {
      const coords = parseCoords(job.coordinates)
      if (coords) results.push(formatJob(job, coords.lat, coords.lng))
    }
    return results
  }, [jobs])

  const [geocodedJobs, setGeocodedJobs] = useState<any[]>([])
  const [baseLocation, setBaseLocation] = useState<{ lat: number; lng: number; name: string } | undefined>()

  // Geocode org address for home base star
  useEffect(() => {
    if (!orgAddress?.address) return

    async function geocodeOrg() {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: orgAddress!.address, format: 'json', limit: '1' })}`,
          { headers: { 'User-Agent': 'ServiceOfficial/1.0' } }
        )
        const data = await res.json()
        if (data.length > 0) {
          setBaseLocation({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            name: orgAddress!.name,
          })
        }
      } catch {}
    }

    geocodeOrg()
  }, [orgAddress])

  // Only geocode jobs that DON'T have coordinates
  useEffect(() => {
    const jobsNeedingGeocode = jobs.filter(j => !parseCoords(j.coordinates) && j.address_line1)
    if (jobsNeedingGeocode.length === 0) return

    async function geocode() {
      const results = []
      for (const job of jobsNeedingGeocode) {
        const address = [job.address_line1, job.city, job.state, job.zip].filter(Boolean).join(', ')
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: address, format: 'json', limit: '1' })}`,
            { headers: { 'User-Agent': 'ServiceOfficial/1.0' } }
          )
          const data = await res.json()
          if (data.length > 0) {
            results.push(formatJob(job, parseFloat(data[0].lat), parseFloat(data[0].lon)))
          }
          await new Promise(r => setTimeout(r, 1100))
        } catch {}
      }
      setGeocodedJobs(results)
    }

    geocode()
  }, [jobs])

  const allMapJobs = [...jobsWithCoords, ...geocodedJobs]

  // Show map if we have jobs OR a base location
  if (allMapJobs.length === 0 && !baseLocation && jobs.length > 0) {
    return (
      <div className="h-[350px] bg-gray-50 rounded-xl flex items-center justify-center text-sm text-gray-400">
        Geocoding job locations...
      </div>
    )
  }

  if (allMapJobs.length === 0 && !baseLocation) return null

  return <JobMap jobs={allMapJobs} height="350px" type="jobs" baseLocation={baseLocation} />
}
