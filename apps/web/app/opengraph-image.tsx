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
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Shield icon */}
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
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 512 512"
            fill="none"
          >
            <path
              d="M256 48c-60 0-120 24-152 48v128c0 88 64 152 152 192 88-40 152-104 152-192V96c-32-24-92-48-152-48z"
              stroke="white"
              strokeWidth="32"
              strokeLinejoin="round"
            />
          </svg>
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
