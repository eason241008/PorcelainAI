import { ImageAsset } from './types';
import { npmVessels } from './npm_vessels';

const normalizeVesselTitle = (title: string) => title.replace(/^\d+_/, '').trim();

const normalizeVesselEra = (era?: string) => {
  if (!era) {
    return undefined;
  }

  const normalizedEra = era.trim();
  return normalizedEra === '古代' ? undefined : normalizedEra;
};

const normalizedNpmVessels: ImageAsset[] = npmVessels.map((asset) => ({
  ...asset,
  title: normalizeVesselTitle(asset.title),
  era: normalizeVesselEra(asset.era),
}));

const dedupeVesselsByTitle = (assets: ImageAsset[]) => {
  const seenTitles = new Set<string>();

  return assets.filter((asset) => {
    if (seenTitles.has(asset.title)) {
      return false;
    }

    seenTitles.add(asset.title);
    return true;
  });
};

const uniqueNpmVessels = dedupeVesselsByTitle(normalizedNpmVessels);

// ========================================================================
// 1. 数据库：包含所有独立的“碎片（风格）”和“器型（内容）”
// ========================================================================
const _MOCK_DATABASE: ImageAsset[] = [
  // --- Fragments (Style Sources / 风格来源) ---
  { id: 'CZZ_0851', url: '/images/style/CZZ_0851.png', title: '碎片 - 紫竹', description: '古陶瓷纹理样本', type: 'fragment', era: '紫竹', material: '瓷' },
  { id: 'CZZ_0877', url: '/images/style/CZZ_0877.png', title: '碎片 - 紫竹', description: '古陶瓷纹理样本', type: 'fragment', era: '紫竹', material: '瓷' },
  { id: 'DGS_1309', url: '/images/style/DGS_1309.png', title: '碎片 - 高山', description: '古陶瓷纹理样本', type: 'fragment', era: '高山', material: '瓷' },
  { id: 'DGS_1919', url: '/images/style/DGS_1919.png', title: '碎片 - 高山', description: '古陶瓷纹理样本', type: 'fragment', era: '高山', material: '瓷' },
  { id: 'DMC_0443', url: '/images/style/DMC_0443.png', title: '碎片 - 芒城', description: '古陶瓷纹理样本', type: 'fragment', era: '芒城', material: '瓷' },
  { id: 'DMC_0895', url: '/images/style/DMC_0895.png', title: '碎片 - 芒城', description: '古陶瓷纹理样本', type: 'fragment', era: '芒城', material: '瓷' },
  { id: 'GHZ0089', url: '/images/style/GHZ0089.png', title: '碎片 - 合作', description: '古陶瓷纹理样本', type: 'fragment', era: '合作', material: '瓷' },
  { id: 'GHZ0215', url: '/images/style/GHZ0215.png', title: '碎片 - 合作', description: '古陶瓷纹理样本', type: 'fragment', era: '合作', material: '瓷' },
  { id: 'GLH_0157', url: '/images/style/GLH_0157.png', title: '碎片 - 联合', description: '古陶瓷纹理样本', type: 'fragment', era: '联合', material: '瓷' },
  { id: 'GLH_0751', url: '/images/style/GLH_0751.png', title: '碎片 - 联合', description: '古陶瓷纹理样本', type: 'fragment', era: '联合', material: '瓷' },
  { id: 'GSX_0567', url: '/images/style/GSX_0567.png', title: '碎片 - 三星堆', description: '古陶瓷纹理样本', type: 'fragment', era: '三星堆', material: '瓷' },
  { id: 'GSX_1965', url: '/images/style/GSX_1965.png', title: '碎片 - 三星堆', description: '古陶瓷纹理样本', type: 'fragment', era: '三星堆', material: '瓷' },
  { id: 'JSM_1749', url: '/images/style/JSM_1749.png', title: '碎片 - 石门坎', description: '古陶瓷纹理样本', type: 'fragment', era: '石门坎', material: '瓷' },
  { id: 'JSM_6659', url: '/images/style/JSM_6659.png', title: '碎片 - 石门坎', description: '古陶瓷纹理样本', type: 'fragment', era: '石门坎', material: '瓷' },
  { id: 'JXF_0113', url: '/images/style/JXF_0113.png', title: '碎片 - 幸福桥', description: '古陶瓷纹理样本', type: 'fragment', era: '幸福桥', material: '瓷' },
  { id: 'JXF_0203', url: '/images/style/JXF_0203.png', title: '碎片 - 幸福桥', description: '古陶瓷纹理样本', type: 'fragment', era: '幸福桥', material: '瓷' },
  { id: 'JZY_0141', url: '/images/style/JZY_0141.png', title: '碎片 - 中医院', description: '古陶瓷纹理样本', type: 'fragment', era: '中医院', material: '瓷' },
  { id: 'JZY_0217', url: '/images/style/JZY_0217.png', title: '碎片 - 中医院', description: '古陶瓷纹理样本', type: 'fragment', era: '中医院', material: '瓷' },
  { id: 'PGC_0029', url: '/images/style/PGC_0029.png', title: '碎片 - 郫都', description: '古陶瓷纹理样本', type: 'fragment', era: '郫都', material: '瓷' },
  { id: 'PGC_0031', url: '/images/style/PGC_0031.png', title: '碎片 - 郫都', description: '古陶瓷纹理样本', type: 'fragment', era: '郫都', material: '瓷' },
  { id: 'PJQ0141', url: '/images/style/PJQ0141.png', title: '碎片 - 姜桥村', description: '古陶瓷纹理样本', type: 'fragment', era: '姜桥村', material: '瓷' },
  { id: 'PJQ0529', url: '/images/style/PJQ0529.png', title: '碎片 - 姜桥村', description: '古陶瓷纹理样本', type: 'fragment', era: '姜桥村', material: '瓷' },
  { id: 'QKH0135', url: '/images/style/QKH0135.png', title: '碎片 - 康和', description: '古陶瓷纹理样本', type: 'fragment', era: '康和', material: '瓷' },
  { id: 'QKH0221', url: '/images/style/QKH0221.png', title: '碎片 - 康和', description: '古陶瓷纹理样本', type: 'fragment', era: '康和', material: '瓷' },
  { id: 'QSX_0161', url: '/images/style/QSX_0161.png', title: '碎片 - 三星村', description: '古陶瓷纹理样本', type: 'fragment', era: '三星村', material: '瓷' },
  { id: 'QSX_0409', url: '/images/style/QSX_0409.png', title: '碎片 - 三星村', description: '古陶瓷纹理样本', type: 'fragment', era: '三星村', material: '瓷' },
  { id: 'SGY_0133', url: '/images/style/SGY_0133.png', title: '碎片 - 桂圆桥', description: '古陶瓷纹理样本', type: 'fragment', era: '桂圆桥', material: '瓷' },
  { id: 'SGY_0233', url: '/images/style/SGY_0233.png', title: '碎片 - 桂圆桥', description: '古陶瓷纹理样本', type: 'fragment', era: '桂圆桥', material: '瓷' },
  { id: 'SK4_0086', url: '/images/style/SK4_0086.png', title: '碎片 - 三星堆K4', description: '古陶瓷纹理样本', type: 'fragment', era: '三星堆K4', material: '瓷' },
  { id: 'SK4_1299', url: '/images/style/SK4_1299.png', title: '碎片 - 三星堆K4', description: '古陶瓷纹理样本', type: 'fragment', era: '三星堆K4', material: '瓷' },
  { id: 'WCX0033', url: '/images/style/WCX0033.png', title: '碎片 - 川西营', description: '古陶瓷纹理样本', type: 'fragment', era: '川西营', material: '瓷' },
  { id: 'WCX0057', url: '/images/style/WCX0057.png', title: '碎片 - 川西营', description: '古陶瓷纹理样本', type: 'fragment', era: '川西营', material: '瓷' },
  { id: 'WYF_0147', url: '/images/style/WYF_0147.png', title: '碎片 - 鱼凫村', description: '古陶瓷纹理样本', type: 'fragment', era: '鱼凫村', material: '瓷' },
  { id: 'WYF_1037', url: '/images/style/WYF_1037.png', title: '碎片 - 鱼凫村', description: '古陶瓷纹理样本', type: 'fragment', era: '鱼凫村', material: '瓷' },
  { id: 'WYF_2179', url: '/images/style/WYF_2179.png', title: '碎片 - 鱼凫村2', description: '古陶瓷纹理样本', type: 'fragment', era: '鱼凫村2', material: '瓷' },
  { id: 'WYF_2205', url: '/images/style/WYF_2205.png', title: '碎片 - 鱼凫村2', description: '古陶瓷纹理样本', type: 'fragment', era: '鱼凫村2', material: '瓷' },
  { id: 'XBD_0299', url: '/images/style/XBD_0299.png', title: '碎片 - 古遗址宝墩', description: '古陶瓷纹理样本', type: 'fragment', era: '古遗址宝墩', material: '瓷' },
  { id: 'XBD_0309', url: '/images/style/XBD_0309.png', title: '碎片 - 古遗址宝墩', description: '古陶瓷纹理样本', type: 'fragment', era: '古遗址宝墩', material: '瓷' },
  { id: 'XCJ_0083', url: '/images/style/XCJ_0083.png', title: '碎片 - 朱家村', description: '古陶瓷纹理样本', type: 'fragment', era: '朱家村', material: '瓷' },
  { id: 'XCJ_0219', url: '/images/style/XCJ_0219.png', title: '碎片 - 朱家村', description: '古陶瓷纹理样本', type: 'fragment', era: '朱家村', material: '瓷' },

];

export const MOCK_DATABASE: ImageAsset[] = [..._MOCK_DATABASE, ...uniqueNpmVessels];

// ========================================================================
// 2. 修复成果：包含生成图、对应的原图、风格图以及评价指标
// ========================================================================
export const MOCK_RESTORATIONS = [
  {
    id: 'res_1714539_青花花鳥紋杯_QKH0135',
    result: '/images/generate_image/1714539_青花花鳥紋杯_style_QKH0135.png',
    styleThumb: '/images/style/QKH0135.png',
    contentThumb: '/images/content/npm/0238_1714539_青花花鳥紋杯.jpg',
    title: '生成展示 1714539_青花花鳥紋杯 + QKH0135',
  },
  {
    id: 'res_1077766_青花番蓮紋洗_PJQ0529',
    result: '/images/generate_image/1077766_青花番蓮紋洗_style_PJQ0529.png',
    styleThumb: '/images/style/PJQ0529.png',
    contentThumb: '/images/content/npm/0692_1077766_青花番蓮紋洗.jpg',
    title: '生成展示 1077766_青花番蓮紋洗 + PJQ0529',
  },
  {
    id: 'res_469962_定窯_白瓷印花雲龍紋洗_JXF_0113',
    result: '/images/generate_image/469962_定窯_白瓷印花雲龍紋洗_style_JXF_0113.png',
    styleThumb: '/images/style/JXF_0113.png',
    contentThumb: '/images/content/npm/0759_469962_定窯_白瓷印花雲龍紋洗.jpg',
    title: '生成展示 469962_定窯_白瓷印花雲龍紋洗 + JXF_0113',
  },
  {
    id: 'res_1713476_霽紅釉瓶_PJQ0529',
    result: '/images/generate_image/1713476_霽紅釉瓶_style_PJQ0529.png',
    styleThumb: '/images/style/PJQ0529.png',
    contentThumb: '/images/content/npm/0604_1713476_霽紅釉瓶.jpg',
    title: '生成展示 1713476_霽紅釉瓶 + PJQ0529',
  },
  {
    id: 'res_985481_五彩山水花卉紋蓋罐_GLH_0751',
    result: '/images/generate_image/985481_五彩山水花卉紋蓋罐_style_GLH_0751.png',
    styleThumb: '/images/style/GLH_0751.png',
    contentThumb: '/images/content/npm/0558_985481_五彩山水花卉紋蓋罐.jpg',
    title: '生成展示 985481_五彩山水花卉紋蓋罐 + GLH_0751',
  },
  {
    id: 'res_415571_甜白釉蓮子茶鍾_GHZ0089',
    result: '/images/generate_image/415571_甜白釉蓮子茶鍾_style_GHZ0089.png',
    styleThumb: '/images/style/GHZ0089.png',
    contentThumb: '/images/content/npm/0432_415571_甜白釉蓮子茶鍾.jpg',
    title: '生成展示 415571_甜白釉蓮子茶鍾 + GHZ0089',
  },
  {
    id: 'res_1217141_鬥彩花蝶紋罐_GHZ0089',
    result: '/images/generate_image/1217141_鬥彩花蝶紋罐_style_GHZ0089.png',
    styleThumb: '/images/style/GHZ0089.png',
    contentThumb: '/images/content/npm/0095_1217141_鬥彩花蝶紋罐.jpg',
    title: '生成展示 1217141_鬥彩花蝶紋罐 + GHZ0089',
  },
  {
    id: 'res_1741801_粉彩花鳥紋花盆_SK4_0086',
    result: '/images/generate_image/1741801_粉彩花鳥紋花盆_style_SK4_0086.png',
    styleThumb: '/images/style/SK4_0086.png',
    contentThumb: '/images/content/npm/0281_1741801_粉彩花鳥紋花盆.jpg',
    title: '生成展示 1741801_粉彩花鳥紋花盆 + SK4_0086',
  },
  {
    id: 'res_1225472_青花番蓮福壽紋雙耳扁壺_SGY_0233',
    result: '/images/generate_image/1225472_青花番蓮福壽紋雙耳扁壺_style_SGY_0233.png',
    styleThumb: '/images/style/SGY_0233.png',
    contentThumb: '/images/content/npm/0104_1225472_青花番蓮福壽紋雙耳扁壺.jpg',
    title: '生成展示 1225472_青花番蓮福壽紋雙耳扁壺 + SGY_0233',
  },
  {
    id: 'res_1077798_鬥彩花卉紋青花梵文杯_DGS_1309',
    result: '/images/generate_image/1077798_鬥彩花卉紋青花梵文杯_style_DGS_1309.png',
    styleThumb: '/images/style/DGS_1309.png',
    contentThumb: '/images/content/npm/0027_1077798_鬥彩花卉紋青花梵文杯.jpg',
    title: '生成展示 1077798_鬥彩花卉紋青花梵文杯 + DGS_1309',
  },
  {
    id: 'res_430813_青花釉裡紅花鳥紋瓶_JSM_1749',
    result: '/images/generate_image/430813_青花釉裡紅花鳥紋瓶_style_JSM_1749.png',
    styleThumb: '/images/style/JSM_1749.png',
    contentThumb: '/images/content/npm/0654_430813_青花釉裡紅花鳥紋瓶.jpg',
    title: '生成展示 430813_青花釉裡紅花鳥紋瓶 + JSM_1749',
  },
  {
    id: 'res_173510_三彩藍地番蓮紋花盆_XBD_0309',
    result: '/images/generate_image/173510_三彩藍地番蓮紋花盆_style_XBD_0309.png',
    styleThumb: '/images/style/XBD_0309.png',
    contentThumb: '/images/content/npm/0250_173510_三彩藍地番蓮紋花盆.jpg',
    title: '生成展示 173510_三彩藍地番蓮紋花盆 + XBD_0309',
  }
];
