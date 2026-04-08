import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          borderRadius: 36,
        }}
      >
        <svg
          width="100"
          height="100"
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
    ),
    { ...size }
  )
}
