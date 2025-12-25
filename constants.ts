import { ImageAsset } from './types';

export const MOCK_DATABASE: ImageAsset[] = [
  // Fragments (Style Sources)
  {
    id: 'f1',
    url: 'public/images/3273.jpg', 
    title: '青花瓷碎片',
    description: '明代青花瓷残片，釉色浓郁。',
    type: 'fragment',
    era: '明代',
    material: '瓷'
  },
  {
    id: 'f2',
    url: 'public/images/3273.jpg',
    title: '古陶裂纹',
    description: '新石器时代陶器碎片，带有明显的风化痕迹。',
    type: 'fragment',
    era: '新石器时代',
    material: '陶'
  },
  {
    id: 'f3',
    url: 'public/images/3273.jpg',
    title: '青瓷纹理',
    description: '宋代青瓷碎片，具有独特的开片纹理。',
    type: 'fragment',
    era: '宋代',
    material: '青瓷'
  },
  {
    id: 'f4',
    url: 'public/images/3273.jpg',
    title: '绞胎纹',
    description: '唐代绞胎工艺，如大理石般流动的纹理。',
    type: 'fragment',
    era: '唐代',
    material: '炻器'
  },
  // Vessels (Content Sources)
  {
    id: 'v1',
    url: 'public/images/3273.jpg',
    title: '梅瓶',
    description: '经典的梅瓶造型，素雅无饰。',
    type: 'vessel',
    era: '现代复刻',
  },
  {
    id: 'v2',
    url: 'public/images/3273.jpg',
    title: '茶盏',
    description: '宽口茶盏，适合点茶。',
    type: 'vessel',
    era: '现代复刻',
  },
  {
    id: 'v3',
    url: 'public/images/3273.jpg',
    title: '葫芦瓶',
    description: '寓意吉祥的葫芦造型。',
    type: 'vessel',
    era: '现代复刻',
  },
  {
    id: 'v4',
    url: 'public/images/3273.jpg',
    title: '陶罐',
    description: '结实耐用的储物罐造型。',
    type: 'vessel',
    era: '唐风',
  }
];

export const MOCK_RESTORATIONS = [
  {
    id: 'r1',
    result: 'public/images/result_softedge.png',
    styleThumb: 'public/images/CZZ_0851.png',
    contentThumb: 'public/images/3273.jpg',
    title: '大明风华'
  },
  {
    id: 'r2',
    result: 'public/images/result_softedge.png',
    styleThumb: 'public/images/CZZ_0851.png',
    contentThumb: 'public/images/3273.jpg',
    title: '新石器陶钵'
  },
  {
    id: 'r3',
    result: 'public/images/result_softedge.png',
    styleThumb: 'public/images/CZZ_0851.png',
    contentThumb: 'public/images/3273.jpg',
    title: '青瓷葫芦'
  },
  {
    id: 'r4',
    result: 'public/images/result_softedge.png',
    styleThumb: 'public/images/CZZ_0851.png',
    contentThumb: 'public/images/3273.jpg',
    title: '唐韵绞胎罐'
  },
    {
    id: 'r5',
    result: 'public/images/result_softedge.png',
    styleThumb: 'public/images/CZZ_0851.png',
    contentThumb: 'public/images/3273.jpg',
    title: '清代青花'
  },
];
