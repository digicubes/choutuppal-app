import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const alt = 'Choutuppal App - Your Super App'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1d4ed8, #d4af37)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '200px',
            height: '200px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            marginBottom: '40px',
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          <div
            style={{
              fontSize: '120px',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: 1,
            }}
          >
            C
          </div>
        </div>
        <div
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          Choutuppal App
        </div>
        <div
          style={{
            fontSize: '40px',
            fontWeight: 'bold',
            color: '#fef3c7',
            textAlign: 'center',
            marginBottom: '60px',
          }}
        >
          Your Super App for Choutuppal
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          Powered by Citizen CSC
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
