import { ImageResponse } from 'next/og';
import { gardenDescription, gardenTitle } from '@/lib/garden/config';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background:
            'radial-gradient(circle at 30% 20%, rgba(216, 181, 107, 0.18), transparent 55%), radial-gradient(circle at 80% 10%, rgba(182, 232, 208, 0.14), transparent 45%), linear-gradient(135deg, #07080b 0%, #0e1218 45%, #161b23 100%)',
          color: '#f6e9d0',
          textAlign: 'center',
          letterSpacing: '0.04em',
          fontFamily: 'Georgia, Times, serif'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 50%, rgba(246, 233, 208, 0.08), transparent 60%)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 90,
            left: 120,
            right: 120,
            height: 1,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(216, 181, 107, 0.6) 50%, transparent 100%)',
            boxShadow: '0 0 24px rgba(216, 181, 107, 0.4)'
          }}
        />
        <div style={{ fontSize: 72, fontWeight: 600, zIndex: 1 }}>{gardenTitle}</div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            fontWeight: 300,
            color: 'rgba(246, 233, 208, 0.78)',
            fontFamily: 'ui-sans-serif, system-ui'
          }}
        >
          {gardenDescription}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 90,
            width: 520,
            height: 2,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(216, 181, 107, 0.5) 50%, transparent 100%)',
            boxShadow: '0 0 18px rgba(216, 181, 107, 0.45)'
          }}
        />
      </div>
    ),
    {
      width: size.width,
      height: size.height
    }
  );
}
