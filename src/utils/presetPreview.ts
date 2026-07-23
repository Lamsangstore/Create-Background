/**
 * Generates a small, self-contained SVG "style preview" for a studio preset.
 * It renders the background gradient, a lit surface, a soft contact shadow,
 * a generic product silhouette, and a faded floor reflection — so each preset
 * card conveys its background + lighting mood without any external image.
 */

export interface PresetPreviewOpts {
  bgFrom: string;      // background gradient top
  bgTo: string;        // background gradient bottom
  surface: string;     // floor / tabletop color
  product: string;     // product silhouette base color
  productHi: string;   // product highlight / rim-light color
  glow: string;        // soft key-light glow color (rgba)
  reflection: number;  // floor reflection strength 0..1
}

export function generatePresetPreview(o: PresetPreviewOpts): string {
  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${o.bgFrom}"/>
      <stop offset="1" stop-color="${o.bgTo}"/>
    </linearGradient>
    <radialGradient id="lg" cx="0.34" cy="0.18" r="0.95">
      <stop offset="0" stop-color="${o.glow}"/>
      <stop offset="1" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <linearGradient id="pr" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${o.product}"/>
      <stop offset="0.5" stop-color="${o.productHi}"/>
      <stop offset="1" stop-color="${o.product}"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.65"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <mask id="rm"><rect x="0" y="208" width="480" height="80" fill="url(#fade)"/></mask>
    <clipPath id="fl"><rect x="0" y="208" width="480" height="80"/></clipPath>
  </defs>

  <rect width="480" height="300" fill="url(#bg)"/>
  <rect x="0" y="184" width="480" height="116" fill="${o.surface}" opacity="0.5"/>
  <rect width="480" height="300" fill="url(#lg)"/>

  <ellipse cx="240" cy="208" rx="80" ry="13" fill="rgba(0,0,0,0.30)"/>

  <g clip-path="url(#fl)" mask="url(#rm)" transform="translate(0,416) scale(1,-1)" opacity="${o.reflection}">
    <rect x="210" y="94" width="60" height="114" rx="14" fill="url(#pr)"/>
  </g>

  <g>
    <rect x="210" y="94" width="60" height="114" rx="14" fill="url(#pr)"/>
    <rect x="226" y="68" width="28" height="32" rx="5" fill="${o.product}"/>
    <rect x="222" y="55" width="36" height="16" rx="5" fill="${o.productHi}"/>
    <rect x="220" y="112" width="11" height="74" rx="5" fill="rgba(255,255,255,0.28)"/>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
