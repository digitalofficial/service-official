import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const alt = 'Service Official — The Contractor Operating System'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  const iconData = await readFile(join(process.cwd(), 'public', 'icon.png'))
  const iconSrc = `data:image/png;base64,${iconData.toString('base64')}`

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
        <img
          src={iconSrc}
          width={120}
          height={120}
          style={{ marginBottom: 40 }}
        />
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
