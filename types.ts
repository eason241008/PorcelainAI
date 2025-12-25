export interface ImageAsset {
  id: string;
  url: string;
  title: string;
  description: string;
  type: 'fragment' | 'vessel'; // fragment = style, vessel = content
  era?: string;
  material?: string;
}

export type GenerationStatus = 'idle' | 'processing' | 'success' | 'error';

export interface StyleTransferRequest {
  styleImage: string; // base64 or url
  contentImage: string; // base64 or url
  additionalPrompt?: string;
}

export interface GalleryFilter {
  search: string;
  type: 'all' | 'fragment' | 'vessel';
}