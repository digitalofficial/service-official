'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Dynamic import to avoid SSR issues with Leaflet
const JobMap = dynamic(() => import('@/components/maps/job-map').then(m => ({ default: m.JobMap })), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">Loading map...</div>,
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

interface BaseLocation {
  lat: number
  lng: number
  name?: string
}

export function JobsMapView({ jobs, height = '500px', orgAddress }: { jobs: Job[]; height?: string; orgAddress?: string }) {
  const [mapJobs, setMapJobs] = useState<any[]>([])
  const [baseLocation, setBaseLocation] = useState<BaseLocation | undefined>()

  // Geocode org base location
  useEffect(() => {
    if (!orgAddress) return
    try {
      const parsed = JSON.parse(orgAddress)
      if (!parsed.address) return
      fetch(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: parsed.address, format: 'json', limit: '1' })}`, {
        headers: { 'User-Agent': 'ServiceOfficial/1.0' },
      })
        .then(r => r.json())
        .then(data => {
          if (data.length > 0) {
            setBaseLocation({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: parsed.name })
          }
        })
        .catch(() => {})
    } catch {}
  }, [orgAddress])

  useEffect(() => {
    async function geocodeJobs() {
      const results = []
      for (const job of jobs) {
        // Parse coordinates — handle string or object
        let coords: { lat: number; lng: number } | null = null
        if (job.coordinates) {
          const c = typeof job.coordinates === 'string' ? JSON.parse(job.coordinates) : job.coordinates
          if (c?.lat && c?.lng) coords = { lat: Number(c.lat), lng: Number(c.lng) }
        }

        // Use existing coordinates if available
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
        <div style={{ height }} className="bg-gray-50 rounded-xl flex items-center justify-center text-sm text-gray-400">
          Geocoding job locations...
        </div>
      ) : (
        <JobMap jobs={mapJobs} height={height} type="jobs" baseLocation={baseLocation} />
      )}
      <p className="text-xs text-gray-400 mt-2">
        {mapJobs.length} of {jobs.length} jobs mapped — double-click a pin to open the job
      </p>
    </div>
  )
}
