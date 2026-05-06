"use client"

import React from "react"

interface ShapeConfig {
  w: number
  h: number
  top?: number | string
  bottom?: number
  left?: number | string
  right?: number | string
  rotation: number
  color: string
  opacity: number
  br: number | string
  delay: number
}

const SHAPES: ShapeConfig[] = [
  { w: 340, h: 340, top: -80,    left: -80,   rotation: -18, color: '#FFCC00', opacity: 0.13, br: 28,    delay: 0 },
  { w: 260, h: 260, bottom: -60, right: -60,  rotation:  25, color: '#FFCC00', opacity: 0.10, br: 24,    delay: 3 },
  { w: 180, h: 180, top: '60%',  left: -50,   rotation:  -8, color: '#ffffff', opacity: 0.07, br: 20,    delay: 6 },
  { w: 200, h: 200, top: 30,     right: -40,  rotation:  15, color: '#4A90D9', opacity: 0.20, br: '50%', delay: 2 },
  { w: 120, h: 120, top: '45%',  right: 40,   rotation:  35, color: '#FFCC00', opacity: 0.15, br: 16,    delay: 8 },
  { w: 90,  h: 90,  top: '15%',  left: '42%', rotation:  20, color: '#ffffff', opacity: 0.07, br: 12,    delay: 4 },
]

export function DrawerBackground() {
  return (
    <>
      <style>{`
        @keyframes floatDrift {
          0%, 100% { transform: rotate(var(--rotation)) translateY(0px);   }
          50%       { transform: rotate(var(--rotation)) translateY(-14px); }
        }
        .dbg-shape {
          position: absolute;
          pointer-events: none;
          z-index: 0;
          animation: floatDrift 22s ease-in-out infinite;
        }
      `}</style>
      {SHAPES.map((s, i) => {
        const style: Record<string, string | number> = {
          width: s.w,
          height: s.h,
          background: s.color,
          opacity: s.opacity,
          borderRadius: typeof s.br === 'number' ? `${s.br}px` : s.br,
          animationDelay: `${s.delay}s`,
          '--rotation': `${s.rotation}deg`,
        }
        if (s.top    !== undefined) style.top    = typeof s.top    === 'number' ? `${s.top}px`    : s.top
        if (s.bottom !== undefined) style.bottom = `${s.bottom}px`
        if (s.left   !== undefined) style.left   = typeof s.left   === 'number' ? `${s.left}px`   : s.left
        if (s.right  !== undefined) style.right  = typeof s.right  === 'number' ? `${s.right}px`  : s.right

        return <div key={i} className="dbg-shape" style={style as React.CSSProperties} />
      })}
    </>
  )
}
