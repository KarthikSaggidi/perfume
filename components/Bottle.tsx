import type { CSSProperties } from 'react';

export default function Bottle({ color = '#343329', name = 'NOIR ESSENCE', small = false }: { color?: string; name?: string; small?: boolean }) {
  return <div className={`bottle ${small ? 'small' : ''}`} style={{ '--liquid': color } as CSSProperties} role="img" aria-label={`${name} perfume bottle`}>
    <div className="bottle-cap" />
    <div className="bottle-neck" />
    <div className="bottle-glass">
      <div className="bottle-face bottle-back" aria-hidden="true"><span>VELORA</span><small>COMPOSED BY NATURE<br />CRAFTED WITH INTENTION<br /><br />EAU DE PARFUM · 50 ML</small></div>
      <div className="bottle-face bottle-side-left" aria-hidden="true" />
      <div className="bottle-face bottle-side-right" aria-hidden="true" />
      <div className="bottle-label"><span>VELORA</span><i /><strong>{name}</strong><small>EAU DE PARFUM<br />50 ML · 1.7 FL.OZ.</small></div>
    </div>
  </div>;
}
