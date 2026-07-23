import { StudioPreset, ProductType } from '../types';

export const PRODUCT_TYPES: { id: ProductType; labelTh: string; labelEn: string; promptWord: string }[] = [
  { id: 'belt', labelTh: 'เข็มขัด (Belt)', labelEn: 'Belt', promptWord: 'belt' },
  { id: 'watch', labelTh: 'นาฬิกา (Watch)', labelEn: 'Watch', promptWord: 'watch' },
  { id: 'bag', labelTh: 'กระเป๋า (Bag)', labelEn: 'Bag', promptWord: 'bag' },
  { id: 'shoes', labelTh: 'รองเท้า (Shoes)', labelEn: 'Shoes', promptWord: 'shoes' },
  { id: 'jewelry', labelTh: 'เครื่องประดับ (Jewelry)', labelEn: 'Jewelry', promptWord: 'jewelry item' },
  { id: 'cosmetics', labelTh: 'เครื่องสำอาง (Cosmetics)', labelEn: 'Cosmetics', promptWord: 'cosmetic product' },
  { id: 'general', labelTh: 'สินค้าทั่วไป (Product)', labelEn: 'product', promptWord: 'product' },
];

export const STUDIO_PRESETS: StudioPreset[] = [
  {
    id: 'studio-white-reflection',
    titleTh: 'สตูดิโอสีขาวเงาสะท้อน (ต้นฉบับที่คุณกำหนด)',
    titleEn: 'Clean White Studio with Reflection (Default)',
    descriptionTh: 'ฉากหลังขาวสตูดิโอ แสงสีขาวอุ่นละมุน เงาตกกระทบสมจริงและเงาสะท้อนพื้นแบบช่างภาพมืออาชีพ',
    descriptionEn: 'Clean white studio background, soft warm lighting, natural surface shadow, and light floor reflection.',
    badge: 'ตามคำสั่งของคุณ',
    previewBgClass: 'from-slate-100 to-white border-amber-300',
    promptTemplate: `Use the original image as is.
Do NOT modify, recolor, reshape, or retouch the {PRODUCT} product in any way.
Only replace the background.

Create a clean white studio background with soft warm white lighting.
Add a subtle natural surface shadow and a light floor reflection beneath the {PRODUCT},
similar to professional product photography.

The background should be seamless, minimal, and realistic.
Lighting must be soft and diffused, not dramatic.
The {PRODUCT} must remain exactly the same as the original image and be the clear focal point.`
  },
  {
    id: 'luxury-dark-slate',
    titleTh: 'สตูดิโอหินชนวนดำหรูหรา',
    titleEn: 'Luxury Dark Slate & Rim Light',
    descriptionTh: 'ฉากหินหินชนวนสีเข้มพร้อมไฟ Rim Light ขอบทอง หรูหรา เงาสะท้อนระดับพรีเมียม',
    descriptionEn: 'Dark slate background with subtle golden rim lighting and premium reflections.',
    badge: 'Luxury',
    previewBgClass: 'from-slate-900 to-slate-800 border-slate-700 text-white',
    promptTemplate: `Use the original image as is.
Do NOT modify, recolor, reshape, or retouch the {PRODUCT} product in any way.
Only replace the background.

Create an elegant dark charcoal slate studio background with soft warm accent rim lighting.
Add a subtle natural surface contact shadow and a soft floor reflection beneath the {PRODUCT},
similar to high-end luxury product display photography.

The background should be seamless, dark, premium, and realistic.
Lighting must be soft and highlight the edges of the {PRODUCT}.
The {PRODUCT} must remain exactly the same as the original image and be the primary focal point.`
  },
  {
    id: 'marble-warm-sunlight',
    titleTh: 'เคาน์เตอร์หินอ่อนและแสงแดดธรรมชาติ',
    titleEn: 'Warm Marble & Soft Sunlight',
    descriptionTh: 'พื้นผิวหินอ่อนสีขาวนวลพร้อมแสงแดดละมุนส่องผ่านหน้าต่าง เงาพุ่มไม้อ่อนๆ',
    descriptionEn: 'White marble surface with gentle warm window sunlight and subtle shadows.',
    badge: 'E-commerce Popular',
    previewBgClass: 'from-stone-100 to-stone-200 border-stone-300',
    promptTemplate: `Use the original image as is.
Do NOT modify, recolor, reshape, or retouch the {PRODUCT} product in any way.
Only replace the background.

Place the {PRODUCT} on a smooth white marble counter surface with soft, warm morning sunlight coming from a side window.
Add a gentle natural contact shadow beneath the {PRODUCT} and a light subtle floor reflection.
The background features a soft out-of-focus indoor studio ambience.

The lighting must be warm, soft, and natural.
The {PRODUCT} must remain exactly identical to the original reference image.`
  },
  {
    id: 'minimalist-pedestal-arch',
    titleTh: 'แท่นดิสเพลย์มินิมอลสีเบจ',
    titleEn: 'Minimalist Beige Pedestal',
    descriptionTh: 'ฉากสถาปัตยกรรมมินิมอล แท่นวางทรงกลมสีเบจ แสงสว่างนุ่มนวลกระจายทั่วภาพ',
    descriptionEn: 'Minimalist cylinder pedestal with architectural shadows and soft studio light.',
    badge: 'Modern',
    previewBgClass: 'from-amber-50 to-orange-100 border-amber-200',
    promptTemplate: `Use the original image as is.
Do NOT modify, recolor, reshape, or retouch the {PRODUCT} product in any way.
Only replace the background.

Place the {PRODUCT} on a clean minimalist cylindrical podium in a neutral beige studio space.
Add soft architectural shadows and a clean surface shadow beneath the {PRODUCT}.
Soft diffused studio lighting coming from the top right.

Minimalist, elegant, clean high-fashion editorial product photography style.
The {PRODUCT} must remain untouched and be the focal point.`
  },
  {
    id: 'oak-wood-tabletop',
    titleTh: 'โต๊ะไม้โอ๊คอุ่นนุ่ม',
    titleEn: 'Warm Oak Wooden Table',
    descriptionTh: 'วางบนโต๊ะไม้โอ๊คธรรมชาติ โทนสีอบอุ่น ให้ความรู้สึกคราฟท์ พรีเมียม และมีระดับ',
    descriptionEn: 'Smooth warm oak wooden tabletop with soft natural fill light.',
    badge: 'Natural Craft',
    previewBgClass: 'from-amber-100 to-amber-200 border-amber-300',
    promptTemplate: `Use the original image as is.
Do NOT modify, recolor, reshape, or retouch the {PRODUCT} product in any way.
Only replace the background.

Place the {PRODUCT} on a premium smooth warm oak wooden tabletop.
Add a realistic natural surface shadow directly underneath the {PRODUCT} with soft warm ambient lighting.
The background is a beautifully blurred warm interior studio scene.

Realistic wood texture, soft shadow, seamless integration.
The {PRODUCT} must match the original image exactly.`
  }
];

export function buildPrompt(presetId: string, customPrompt: string, isCustomActive: boolean, productType: ProductType): string {
  if (isCustomActive && customPrompt.trim()) {
    return customPrompt.trim();
  }

  const preset = STUDIO_PRESETS.find(p => p.id === presetId) || STUDIO_PRESETS[0];
  const typeObj = PRODUCT_TYPES.find(t => t.id === productType) || PRODUCT_TYPES[0];
  const word = typeObj.promptWord || 'product';

  return preset.promptTemplate.replace(/\{PRODUCT\}/g, word);
}
