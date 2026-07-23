import { ProductImageItem } from '../types';

function createSvgDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export const SAMPLE_PRODUCTS: Partial<ProductImageItem>[] = [
  {
    name: 'เข็มขัดหนังคลาสสิก (Leather Belt)',
    mimeType: 'image/svg+xml',
    productType: 'belt',
    originalUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" style="background:#e5e7eb;">
        <!-- Neutral Plain Background -->
        <rect width="800" height="800" fill="#e2e8f0"/>
        <text x="400" y="70" font-family="sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle" font-weight="600">SAMPLE PRODUCT: LEATHER BELT</text>
        
        <!-- Curved Brown Leather Belt -->
        <g transform="translate(100, 150)">
          <!-- Belt Shadow on flat background -->
          <path d="M 120 220 C 150 120, 450 120, 480 220 C 510 320, 420 480, 280 480 C 180 480, 110 350, 120 220 Z" 
                fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="48" stroke-linecap="round"/>
          
          <!-- Outer Belt Loop -->
          <path d="M 120 220 C 150 120, 450 120, 480 220 C 510 320, 420 480, 280 480 C 180 480, 110 350, 120 220 Z" 
                fill="none" stroke="#451a03" stroke-width="42" stroke-linecap="round"/>
          <path d="M 120 220 C 150 120, 450 120, 480 220 C 510 320, 420 480, 280 480 C 180 480, 110 350, 120 220 Z" 
                fill="none" stroke="#78350f" stroke-width="38" stroke-linecap="round"/>
          
          <!-- Belt Stitching line -->
          <path d="M 120 220 C 150 120, 450 120, 480 220 C 510 320, 420 480, 280 480 C 180 480, 110 350, 120 220 Z" 
                fill="none" stroke="#fef3c7" stroke-width="2" stroke-dasharray="10 6" stroke-linecap="round"/>
          
          <!-- Belt Holes -->
          <circle cx="200" cy="475" r="5" fill="#27272a"/>
          <circle cx="240" cy="478" r="5" fill="#27272a"/>
          <circle cx="280" cy="480" r="5" fill="#27272a"/>
          <circle cx="320" cy="478" r="5" fill="#27272a"/>

          <!-- Gold Metallic Buckle -->
          <g transform="translate(80, 210) rotate(-15)">
            <rect x="0" y="0" width="90" height="70" rx="12" fill="none" stroke="#fbbf24" stroke-width="14"/>
            <rect x="4" y="4" width="82" height="62" rx="10" fill="none" stroke="#d97706" stroke-width="4"/>
            <!-- Tongue Pin -->
            <line x1="45" y1="5" x2="45" y2="65" stroke="#f59e0b" stroke-width="8" stroke-linecap="round"/>
            <circle cx="45" cy="10" r="4" fill="#78350f"/>
          </g>

          <!-- Leather Keeper Loop -->
          <rect x="180" y="180" width="22" height="52" rx="4" fill="#78350f" stroke="#451a03" stroke-width="3" transform="rotate(-30 180 180)"/>
        </g>
      </svg>
    `)
  },
  {
    name: 'นาฬิกาข้อมือผู้ชาย (Chronograph Watch)',
    mimeType: 'image/svg+xml',
    productType: 'watch',
    originalUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" style="background:#cbd5e1;">
        <rect width="800" height="800" fill="#cbd5e1"/>
        <text x="400" y="70" font-family="sans-serif" font-size="20" fill="#64748b" text-anchor="middle" font-weight="600">SAMPLE PRODUCT: LUXURY WATCH</text>
        
        <!-- Watch Strap Top -->
        <rect x="340" y="100" width="120" height="220" fill="#1e293b" rx="10"/>
        <line x1="350" y1="110" x2="350" y2="310" stroke="#475569" stroke-width="2" stroke-dasharray="8 6"/>
        <line x1="450" y1="110" x2="450" y2="310" stroke="#475569" stroke-width="2" stroke-dasharray="8 6"/>

        <!-- Watch Strap Bottom -->
        <rect x="340" y="480" width="120" height="220" fill="#1e293b" rx="10"/>
        <line x1="350" y1="490" x2="350" y2="690" stroke="#475569" stroke-width="2" stroke-dasharray="8 6"/>
        <line x1="450" y1="490" x2="450" y2="690" stroke="#475569" stroke-width="2" stroke-dasharray="8 6"/>

        <!-- Steel Case -->
        <circle cx="400" cy="400" r="140" fill="#94a3b8" stroke="#f1f5f9" stroke-width="12"/>
        <circle cx="400" cy="400" r="128" fill="#0f172a"/>
        
        <!-- Bezel Marks -->
        <circle cx="400" cy="400" r="120" fill="none" stroke="#e2e8f0" stroke-width="3" stroke-dasharray="4 16"/>

        <!-- Dial Face -->
        <text x="400" y="320" font-family="sans-serif" font-size="16" fill="#f8fafc" text-anchor="middle" font-weight="bold">CHRONO</text>
        
        <!-- Subdials -->
        <circle cx="350" cy="400" r="24" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
        <circle cx="450" cy="400" r="24" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
        <circle cx="400" cy="450" r="24" fill="#1e293b" stroke="#64748b" stroke-width="2"/>

        <!-- Hands -->
        <line x1="400" y1="400" x2="330" y2="350" stroke="#38bdf8" stroke-width="6" stroke-linecap="round"/>
        <line x1="400" y1="400" x2="450" y2="310" stroke="#f8fafc" stroke-width="8" stroke-linecap="round"/>
        <circle cx="400" cy="400" r="10" fill="#38bdf8"/>

        <!-- Crown Button -->
        <rect x="540" y="380" width="20" height="40" rx="4" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
      </svg>
    `)
  },
  {
    name: 'กระเป๋าถือหนังแท้ (Leather Handbag)',
    mimeType: 'image/svg+xml',
    productType: 'bag',
    originalUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" style="background:#d1d5db;">
        <rect width="800" height="800" fill="#d1d5db"/>
        <text x="400" y="70" font-family="sans-serif" font-size="20" fill="#6b7280" text-anchor="middle" font-weight="600">SAMPLE PRODUCT: DESIGNER HANDBAG</text>

        <!-- Handles -->
        <path d="M 280 340 C 280 180, 520 180, 520 340" fill="none" stroke="#7f1d1d" stroke-width="24" stroke-linecap="round"/>
        <path d="M 280 340 C 280 180, 520 180, 520 340" fill="none" stroke="#b91c1c" stroke-width="16" stroke-linecap="round"/>

        <!-- Main Bag Body -->
        <path d="M 200 320 C 210 300, 590 300, 600 320 L 640 620 C 645 650, 620 670, 580 670 L 220 670 C 180 670, 155 650, 160 620 Z" 
              fill="#991b1b" stroke="#7f1d1d" stroke-width="8"/>
        
        <!-- Flap Details -->
        <path d="M 230 320 L 570 320 L 540 460 C 540 480, 260 480, 260 460 Z" fill="#7f1d1d"/>

        <!-- Gold Metal Clasp -->
        <rect x="360" y="440" width="80" height="50" rx="8" fill="#fbbf24" stroke="#d97706" stroke-width="4"/>
        <circle cx="400" cy="465" r="10" fill="#78350f"/>
      </svg>
    `)
  }
];
