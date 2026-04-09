'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapJob {
  id: string
  title: string
  status: string
  lat: number
  lng: number
  address?: string
  customer_name?: string
  scheduled_start?: string
  assignee_name?: string
}

interface BaseLocation {
  lat: number
  lng: number
  name?: string
}

interface JobMapProps {
  jobs: MapJob[]
  height?: string
  type?: 'jobs' | 'projects'
  baseLocation?: BaseLocation
}

const STATUS_COLORS: Record<string, string> = {
  // Jobs
  unscheduled: '#9ca3af',
  scheduled: '#3b82f6',
  en_route: '#06b6d4',
  on_site: '#8b5cf6',
  in_progress: '#f59e0b',
  completed: '#10b981',
  needs_follow_up: '#f97316',
  canceled: '#ef4444',
  // Projects
  lead: '#9ca3af',
  estimating: '#eab308',
  proposal_sent: '#3b82f6',
  approved: '#10b981',
  on_hold: '#f97316',
  punch_list: '#8b5cf6',
  invoiced: '#6366f1',
  paid: '#059669',
}

function createPin(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function createStarIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#c9a84c" stroke="#fff" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

export function JobMap({ jobs, height = '400px', type = 'jobs', baseLocation }: JobMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Default center: Denver, CO
    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([39.74, -104.99], 10)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstance.current = map
    setReady(true)

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInstance.current || !ready) return
    const map = mapInstance.current

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer)
    })

    const bounds: L.LatLngBoundsExpression = []

    // Base location star marker
    if (baseLocation) {
      const starIcon = createStarIcon()
      L.marker([baseLocation.lat, baseLocation.lng], { icon: starIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<div style="font-family:system-ui;font-size:13px;"><p style="font-weight:600;margin:0;">${baseLocation.name ?? 'Home Base'}</p><p style="color:#888;margin:2px 0 0;font-size:12px;">Company location</p></div>`)
      bounds.push([baseLocation.lat, baseLocation.lng] as L.LatLngTuple)
    }

    for (const job of jobs) {
      if (!job.lat || !job.lng) continue

      const color = STATUS_COLORS[job.status] ?? '#9ca3af'
      const icon = createPin(color)

      const time = job.scheduled_start
        ? new Date(job.scheduled_start).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : ''

      const popup = `
        <div style="min-width:180px;font-family:system-ui;font-size:13px;">
          <p style="font-weight:600;margin:0 0 4px;">${job.title}</p>
          ${job.customer_name ? `<p style="color:#666;margin:0 0 2px;">${job.customer_name}</p>` : ''}
          ${job.address ? `<p style="color:#888;margin:0 0 2px;font-size:12px;">${job.address}</p>` : ''}
          ${time ? `<p style="color:#888;margin:0 0 2px;font-size:12px;">${time}</p>` : ''}
          ${job.assignee_name ? `<p style="color:#888;margin:0 0 4px;font-size:12px;">Assigned: ${job.assignee_name}</p>` : ''}
          <p style="margin:4px 0 0;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px;"></span>
            <span style="text-transform:capitalize;font-size:12px;">${job.status.replace(/_/g, ' ')}</span>
          </p>
        </div>
      `

      const marker = L.marker([job.lat, job.lng], { icon })
        .addTo(map)
        .bindPopup(popup)

      marker.on('click', () => {
        marker.openPopup()
      })

      marker.on('dblclick', () => {
        router.push(`/${type === 'projects' ? 'projects' : 'jobs'}/${job.id}`)
      })

      bounds.push([job.lat, job.lng] as L.LatLngTuple)
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 14 })
    }
  }, [jobs, ready, router, type, baseLocation])

  // Legend
  const statuses = [...new Set(jobs.map(j => j.status))]

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 relative z-0">
      <div ref={mapRef} style={{ height, width: '100%' }} />
      {(statuses.length > 0 || baseLocation) && (
        <div className="flex flex-wrap gap-3 px-4 py-2.5 bg-white border-t border-gray-100">
          {baseLocation && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#c9a84c" stroke="#c9a84c" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>Home Base</span>
            </div>
          )}
          {statuses.map(s => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] ?? '#9ca3af' }} />
              <span className="capitalize">{s.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
