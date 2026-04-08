import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Service Official — The Contractor Operating System'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
            fontSize: 64,
          }}
        >
          🛡️
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.02em',
          }}
        >
          Service Official
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            marginTop: 16,
          }}
        >
          The Contractor Operating System
        </div>
      </div>
    ),
    { ...size }
  )
}
