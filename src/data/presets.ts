import { StudioPreset, ProductType } from '../types';
import { generatePresetPreview } from '../utils/presetPreview';

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
    previewImage: generatePresetPreview({
      bgFrom: '#ffffff', bgTo: '#eceff3', surface: '#ffffff',
      product: '#c3ccd6', productHi: '#f4f7fb',
      glow: 'rgba(255,244,214,0.70)', reflection: 0.5,
    }),
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
    previewImage: generatePresetPreview({
      bgFrom: '#263243', bgTo: '#0d141f', surface: '#1b2431',
      product: '#2f3d4e', productHi: '#d9c38a',
      glow: 'rgba(251,191,36,0.30)', reflection: 0.32,
    }),
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
    previewImage: generatePresetPreview({
      bgFrom: '#f3efe7', bgTo: '#e2dccf', surface: '#f7f2e8',
      product: '#d2cec6', productHi: '#fff4dd',
      glow: 'rgba(255,216,150,0.60)', reflection: 0.42,
    }),
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
    previewImage: generatePresetPreview({
      bgFrom: '#f1e7d8', bgTo: '#e0cfb6', surface: '#ece0cd',
      product: '#c8b193', productHi: '#fff2df',
      glow: 'rgba(255,250,240,0.55)', reflection: 0.34,
    }),
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
    previewImage: generatePresetPreview({
      bgFrom: '#dcc5a6', bgTo: '#b98f63', surface: '#a06b39',
      product: '#6f4a29', productHi: '#d9b58a',
      glow: 'rgba(255,226,182,0.50)', reflection: 0.3,
    }),
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

/**
 * Prompt used when the user supplies a reference image: the model receives two
 * images (Image 1 = product, Image 2 = reference) and must copy the reference's
 * background scene and lighting onto the product while keeping the product intact.
 */
export function buildReferencePrompt(productType: ProductType): string {
  const typeObj = PRODUCT_TYPES.find(t => t.id === productType) || PRODUCT_TYPES[0];
  const word = typeObj.promptWord || 'product';

  return `You are given TWO images.
Image 1 is the product photo. Image 2 is a reference photo.

Keep the ${word} from Image 1 exactly as is.
Do NOT modify, recolor, reshape, resize, or retouch the ${word} in any way.

Replace ONLY the background of Image 1 so that the background scene, environment, colors, materials, mood, and — most importantly — the lighting direction, softness, and color temperature closely match the reference in Image 2.
Add a realistic contact shadow and a subtle floor reflection beneath the ${word}, consistent with the lighting in Image 2.

The result must look like a single, seamless, professional product photograph, with the ${word} as the clear focal point.`;
}
