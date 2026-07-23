export type ImageStatus = 'idle' | 'processing' | 'completed' | 'error';

export type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9' | '9:16';

export type ImageSize = '512px' | '1K' | '2K' | '4K';

export type ProductType = 
  | 'belt' 
  | 'watch' 
  | 'bag' 
  | 'shoes' 
  | 'jewelry' 
  | 'cosmetics' 
  | 'general';

export interface ProductImageItem {
  id: string;
  name: string;
  originalUrl: string; // Base64 data URL
  mimeType: string;
  status: ImageStatus;
  resultUrl?: string; // Base64 data URL
  textFeedback?: string;
  errorMessage?: string;
  promptUsed?: string;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  productType?: ProductType;
  createdAt: number;
  completedAt?: number;
}

export interface StudioPreset {
  id: string;
  titleTh: string;
  titleEn: string;
  descriptionTh: string;
  descriptionEn: string;
  badge: string;
  promptTemplate: string;
  previewBgClass: string;
}

export interface StudioConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  selectedPresetId: string;
  productType: ProductType;
  customPrompt: string;
  isCustomPromptActive: boolean;
}
