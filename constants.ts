import { ImageAsset } from './types';
import { npmVessels } from './npm_vessels';

const STYLE_NAME_MAP: Record<string, string> = {
  CZZ_0877: '碎片 - 紫竹',
  DGS_1919: '碎片 - 高山',
  JXF_0203: '碎片 - 幸福桥',
  DMC_0443: '碎片 - 芒城',
  DMC_0895: '碎片 - 芒城',
  GHZ0089: '碎片 - 合作',
  GHZ0215: '碎片 - 合作',
  GLH_0157: '碎片 - 联合',
  GLH_0751: '碎片 - 联合',
  GSX_0567: '碎片 - 三星堆',
  GSX_1965: '碎片 - 三星堆',
  JSM_1749: '碎片 - 石门坎',
  JSM_6659: '碎片 - 石门坎',
  JXF_0113: '碎片 - 幸福桥',
  JZY_0141: '碎片 - 中医院',
  JZY_0217: '碎片 - 中医院',
  PGC_0029: '碎片 - 郫都',
  DGS_1309: '碎片 - 高山',
  PGC_0031: '碎片 - 郫都',
  CZZ_0851: '碎片 - 紫竹',
  PJQ0141: '碎片 - 姜桥村',
  PJQ0529: '碎片 - 姜桥村',
  QKH0135: '碎片 - 康和',
  QKH0221: '碎片 - 康和',
  QSX_0161: '碎片 - 三星村',
  QSX_0409: '碎片 - 三星村',
  SGY_0133: '碎片 - 桂圆桥',
  SGY_0233: '碎片 - 桂圆桥',
  SK4_0086: '碎片 - 三星堆K4',
  SK4_1299: '碎片 - 三星堆K4',
  WCX0033: '碎片 - 川西营',
  WCX0057: '碎片 - 川西营',
  WYF_0147: '碎片 - 鱼凫村',
  WYF_1037: '碎片 - 鱼凫村',
  WYF_2179: '碎片 - 鱼凫村2',
  WYF_2205: '碎片 - 鱼凫村2',
  XBD_0299: '碎片 - 古遗址宝墩',
  XBD_0309: '碎片 - 古遗址宝墩',
  XCJ_0083: '碎片 - 朱家村',
  XCJ_0219: '碎片 - 朱家村',
};

const cleanRestorationContentTitle = (title: string) => title.replace(/^\d+_/, '').replace(/_/g, ' ').trim();

const formatRestorationTitle = (rawTitle: string) => {
  const match = rawTitle.match(/^生成展示\s+(.+?)\s+\+\s+([A-Z0-9_]+)$/);
  if (!match) {
    return rawTitle;
  }

  const [, contentTitle, styleCode] = match;
  const styleName = STYLE_NAME_MAP[styleCode] || styleCode;
  return `${cleanRestorationContentTitle(contentTitle)} + ${styleName}`;
};

// ========================================================================
// 1. 数据库：包含所有独立的“碎片（风格）”和“器型（内容）”
// ========================================================================
const _MOCK_DATABASE: ImageAsset[] = [
  // --- Fragments (Style Sources / 风格来源) ---
  { id: 'CZZ_0877', url: '/images/style/CZZ_0877.png', title: '碎片 - 紫竹', description: '古陶瓷纹理样本', type: 'fragment', era: '紫竹', material: '瓷' },
  { id: 'DGS_1919', url: '/images/style/DGS_1919.png', title: '碎片 - 高山', description: '古陶瓷纹理样本', type: 'fragment', era: '高山', material: '瓷' },
  { id: 'JXF_0203', url: '/images/style/JXF_0203.png', title: '碎片 - 幸福桥', description: '古陶瓷纹理样本', type: 'fragment', era: '幸福桥', material: '瓷' },
  { id: 'DMC_0895', url: '/images/style/DMC_0895.png', title: '碎片 - 芒城', description: '古陶瓷纹理样本', type: 'fragment', era: '芒城', material: '瓷' },
  { id: 'GHZ0089', url: '/images/style/GHZ0089.png', title: '碎片 - 合作', description: '古陶瓷纹理样本', type: 'fragment', era: '合作', material: '瓷' },
  { id: 'GHZ0215', url: '/images/style/GHZ0215.png', title: '碎片 - 合作', description: '古陶瓷纹理样本', type: 'fragment', era: '合作', material: '瓷' },
  { id: 'GLH_0157', url: '/images/style/GLH_0157.png', title: '碎片 - 联合', description: '古陶瓷纹理样本', type: 'fragment', era: '联合', material: '瓷' },
  { id: 'GLH_0751', url: '/images/style/GLH_0751.png', title: '碎片 - 联合', description: '古陶瓷纹理样本', type: 'fragment', era: '联合', material: '瓷' },

  { id: 'CZZ_0851', url: '/images/style/CZZ_0851.png', title: '碎片 - 紫竹', description: '古陶瓷纹理样本', type: 'fragment', era: '紫竹', material: '瓷' },
  { id: 'JSM_1749', url: '/images/style/JSM_1749.png', title: '碎片 - 石门坎', description: '古陶瓷纹理样本', type: 'fragment', era: '石门坎', material: '瓷' },
  { id: 'JSM_6659', url: '/images/style/JSM_6659.png', title: '碎片 - 石门坎', description: '古陶瓷纹理样本', type: 'fragment', era: '石门坎', material: '瓷' },
  { id: 'JXF_0113', url: '/images/style/JXF_0113.png', title: '碎片 - 幸福桥', description: '古陶瓷纹理样本', type: 'fragment', era: '幸福桥', material: '瓷' },
  { id: 'JZY_0141', url: '/images/style/JZY_0141.png', title: '碎片 - 中医院', description: '古陶瓷纹理样本', type: 'fragment', era: '中医院', material: '瓷' },
  { id: 'JZY_0217', url: '/images/style/JZY_0217.png', title: '碎片 - 中医院', description: '古陶瓷纹理样本', type: 'fragment', era: '中医院', material: '瓷' },
  { id: 'PGC_0029', url: '/images/style/PGC_0029.png', title: '碎片 - 郫都', description: '古陶瓷纹理样本', type: 'fragment', era: '郫都', material: '瓷' },
  { id: 'PGC_0031', url: '/images/style/PGC_0031.png', title: '碎片 - 郫都', description: '古陶瓷纹理样本', type: 'fragment', era: '郫都', material: '瓷' },
  { id: 'PJQ0141', url: '/images/style/PJQ0141.png', title: '碎片 - 姜桥村', description: '古陶瓷纹理样本', type: 'fragment', era: '姜桥村', material: '瓷' },
  { id: 'DMC_0443', url: '/images/style/DMC_0443.png', title: '碎片 - 芒城', description: '古陶瓷纹理样本', type: 'fragment', era: '芒城', material: '瓷' },
  { id: 'PJQ0529', url: '/images/style/PJQ0529.png', title: '碎片 - 姜桥村', description: '古陶瓷纹理样本', type: 'fragment', era: '姜桥村', material: '瓷' },
  { id: 'QKH0135', url: '/images/style/QKH0135.png', title: '碎片 - 康和', description: '古陶瓷纹理样本', type: 'fragment', era: '康和', material: '瓷' },
  { id: 'DGS_1309', url: '/images/style/DGS_1309.png', title: '碎片 - 高山', description: '古陶瓷纹理样本', type: 'fragment', era: '高山', material: '瓷' },
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
 { id: 'GSX_0567', url: '/images/style/GSX_0567.png', title: '碎片 - 三星堆', description: '古陶瓷纹理样本', type: 'fragment', era: '三星堆', material: '瓷' },
  { id: 'GSX_1965', url: '/images/style/GSX_1965.png', title: '碎片 - 三星堆', description: '古陶瓷纹理样本', type: 'fragment', era: '三星堆', material: '瓷' },
];

export const MOCK_DATABASE: ImageAsset[] = [..._MOCK_DATABASE, ...npmVessels];

// ========================================================================
// 2. 修复成果：包含生成图、对应的原图、风格图以及评价指标
// ========================================================================
export const MOCK_RESTORATIONS = [
  {
    "id": "showcase_01",
    "result": "/images/showcase/20260509_223627/0006_1055967_茶葉末釉缽_style_QKH0221.png",
    "styleThumb": "/images/style/QKH0221.png",
    "contentThumb": "/images/content/npm/0006_1055967_茶葉末釉缽.jpg",
    "title": "茶葉末釉缽 + 碎片 - 康和",
    "styleLabel": "碎片 - 康和",
    "contentLabel": "茶葉末釉缽",
    "styleId": "QKH0221",
    "contentId": "npm_0006"
  },
  {
    "id": "showcase_02",
    "result": "/images/showcase/20260509_223627/0028_1079174_甜白釉雲龍紋碟_style_WYF_1037.png",
    "styleThumb": "/images/style/WYF_1037.png",
    "contentThumb": "/images/content/npm/0028_1079174_甜白釉雲龍紋碟.jpg",
    "title": "甜白釉雲龍紋碟 + 碎片 - 鱼凫村",
    "styleLabel": "碎片 - 鱼凫村",
    "contentLabel": "甜白釉雲龍紋碟",
    "styleId": "WYF_1037",
    "contentId": "npm_0028"
  },
  {
    "id": "showcase_03",
    "result": "/images/showcase/20260509_223627/0031_1079200_甜白釉碟_style_QKH0135.png",
    "styleThumb": "/images/style/QKH0135.png",
    "contentThumb": "/images/content/npm/0031_1079200_甜白釉碟.jpg",
    "title": "甜白釉碟 + 碎片 - 康和",
    "styleLabel": "碎片 - 康和",
    "contentLabel": "甜白釉碟",
    "styleId": "QKH0135",
    "contentId": "npm_0031"
  },
  {
    "id": "showcase_04",
    "result": "/images/showcase/20260509_223627/0033_1079248_青花四季花卉紋碗_style_DMC_0443.png",
    "styleThumb": "/images/style/DMC_0443.png",
    "contentThumb": "/images/content/npm/0033_1079248_青花四季花卉紋碗.jpg",
    "title": "青花四季花卉紋碗 + 碎片 - 芒城",
    "styleLabel": "碎片 - 芒城",
    "contentLabel": "青花四季花卉紋碗",
    "styleId": "DMC_0443",
    "contentId": "npm_0033"
  },
  {
    "id": "showcase_05",
    "result": "/images/showcase/20260509_223627/0092_1215294_鬥彩纏枝花卉紋杯_style_GLH_0157.png",
    "styleThumb": "/images/style/GLH_0157.png",
    "contentThumb": "/images/content/npm/0092_1215294_鬥彩纏枝花卉紋杯.jpg",
    "title": "鬥彩纏枝花卉紋杯 + 碎片 - 联合",
    "styleLabel": "碎片 - 联合",
    "contentLabel": "鬥彩纏枝花卉紋杯",
    "styleId": "GLH_0157",
    "contentId": "npm_0092"
  },
  {
    "id": "showcase_06",
    "result": "/images/showcase/20260509_223627/0098_1217171_青花花卉紋碗_style_SGY_0133.png",
    "styleThumb": "/images/style/SGY_0133.png",
    "contentThumb": "/images/content/npm/0098_1217171_青花花卉紋碗.jpg",
    "title": "青花花卉紋碗 + 碎片 - 桂圆桥",
    "styleLabel": "碎片 - 桂圆桥",
    "contentLabel": "青花花卉紋碗",
    "styleId": "SGY_0133",
    "contentId": "npm_0098"
  },
  {
    "id": "showcase_07",
    "result": "/images/showcase/20260509_223627/0103_1225361_青花釉裡紅番蓮龍紋扁壺_style_GLH_0157.png",
    "styleThumb": "/images/style/GLH_0157.png",
    "contentThumb": "/images/content/npm/0103_1225361_青花釉裡紅番蓮龍紋扁壺.jpg",
    "title": "青花釉裡紅番蓮龍紋扁壺 + 碎片 - 联合",
    "styleLabel": "碎片 - 联合",
    "contentLabel": "青花釉裡紅番蓮龍紋扁壺",
    "styleId": "GLH_0157",
    "contentId": "npm_0103"
  },
  {
    "id": "showcase_08",
    "result": "/images/showcase/20260509_223627/0108_1227862_紅釉白裡缸_style_XBD_0309.png",
    "styleThumb": "/images/style/XBD_0309.png",
    "contentThumb": "/images/content/npm/0108_1227862_紅釉白裡缸.jpg",
    "title": "紅釉白裡缸 + 碎片 - 古遗址宝墩",
    "styleLabel": "碎片 - 古遗址宝墩",
    "contentLabel": "紅釉白裡缸",
    "styleId": "XBD_0309",
    "contentId": "npm_0108"
  },
  {
    "id": "showcase_09",
    "result": "/images/showcase/20260509_223627/0119_1231247_白瓷蕉葉龍紋觚_style_SGY_0233.png",
    "styleThumb": "/images/style/SGY_0233.png",
    "contentThumb": "/images/content/npm/0119_1231247_白瓷蕉葉龍紋觚.jpg",
    "title": "白瓷蕉葉龍紋觚 + 碎片 - 桂圆桥",
    "styleLabel": "碎片 - 桂圆桥",
    "contentLabel": "白瓷蕉葉龍紋觚",
    "styleId": "SGY_0233",
    "contentId": "npm_0119"
  },
  {
    "id": "showcase_10",
    "result": "/images/showcase/20260509_223627/0165_1257656_霽紅釉碗_style_GHZ0215.png",
    "styleThumb": "/images/style/GHZ0215.png",
    "contentThumb": "/images/content/npm/0165_1257656_霽紅釉碗.jpg",
    "title": "霽紅釉碗 + 碎片 - 合作",
    "styleLabel": "碎片 - 合作",
    "contentLabel": "霽紅釉碗",
    "styleId": "GHZ0215",
    "contentId": "npm_0165"
  },
  {
    "id": "showcase_11",
    "result": "/images/showcase/20260509_223627/0169_1262094_釉裡紅龍紋扁壺_style_PGC_0029.png",
    "styleThumb": "/images/style/PGC_0029.png",
    "contentThumb": "/images/content/npm/0169_1262094_釉裡紅龍紋扁壺.jpg",
    "title": "釉裡紅龍紋扁壺 + 碎片 - 郫都",
    "styleLabel": "碎片 - 郫都",
    "contentLabel": "釉裡紅龍紋扁壺",
    "styleId": "PGC_0029",
    "contentId": "npm_0169"
  },
  {
    "id": "showcase_12",
    "result": "/images/showcase/20260509_223627/0235_1713564_五彩花鳥紋蓋罐_style_CZZ_0851.png",
    "styleThumb": "/images/style/CZZ_0851.png",
    "contentThumb": "/images/content/npm/0235_1713564_五彩花鳥紋蓋罐.jpg",
    "title": "五彩花鳥紋蓋罐 + 碎片 - 紫竹",
    "styleLabel": "碎片 - 紫竹",
    "contentLabel": "五彩花鳥紋蓋罐",
    "styleId": "CZZ_0851",
    "contentId": "npm_0235"
  },
  {
    "id": "showcase_13",
    "result": "/images/showcase/20260509_223627/0243_1714698_青花花卉紋八方花盆_style_QSX_0409.png",
    "styleThumb": "/images/style/QSX_0409.png",
    "contentThumb": "/images/content/npm/0243_1714698_青花花卉紋八方花盆.jpg",
    "title": "青花花卉紋八方花盆 + 碎片 - 三星村",
    "styleLabel": "碎片 - 三星村",
    "contentLabel": "青花花卉紋八方花盆",
    "styleId": "QSX_0409",
    "contentId": "npm_0243"
  },
  {
    "id": "showcase_14",
    "result": "/images/showcase/20260509_223627/0254_1735892_青花幾何花卉紋杯_style_WYF_0147.png",
    "styleThumb": "/images/style/WYF_0147.png",
    "contentThumb": "/images/content/npm/0254_1735892_青花幾何花卉紋杯.jpg",
    "title": "青花幾何花卉紋杯 + 碎片 - 鱼凫村",
    "styleLabel": "碎片 - 鱼凫村",
    "contentLabel": "青花幾何花卉紋杯",
    "styleId": "WYF_0147",
    "contentId": "npm_0254"
  },
  {
    "id": "showcase_15",
    "result": "/images/showcase/20260509_223627/0304_1820397_青花八寶紋高足杯_style_JXF_0203.png",
    "styleThumb": "/images/style/JXF_0203.png",
    "contentThumb": "/images/content/npm/0304_1820397_青花八寶紋高足杯.jpg",
    "title": "青花八寶紋高足杯 + 碎片 - 幸福桥",
    "styleLabel": "碎片 - 幸福桥",
    "contentLabel": "青花八寶紋高足杯",
    "styleId": "JXF_0203",
    "contentId": "npm_0304"
  },
  {
    "id": "showcase_16",
    "result": "/images/showcase/20260509_223627/0307_1820953_甜白釉盤_style_XBD_0299.png",
    "styleThumb": "/images/style/XBD_0299.png",
    "contentThumb": "/images/content/npm/0307_1820953_甜白釉盤.jpg",
    "title": "甜白釉盤 + 碎片 - 古遗址宝墩",
    "styleLabel": "碎片 - 古遗址宝墩",
    "contentLabel": "甜白釉盤",
    "styleId": "XBD_0299",
    "contentId": "npm_0307"
  },
  {
    "id": "showcase_17",
    "result": "/images/showcase/20260509_223627/0377_2655694_粉彩黃地福壽花盆_style_JSM_6659.png",
    "styleThumb": "/images/style/JSM_6659.png",
    "contentThumb": "/images/content/npm/0377_2655694_粉彩黃地福壽花盆.jpg",
    "title": "粉彩黃地福壽花盆 + 碎片 - 石门坎",
    "styleLabel": "碎片 - 石门坎",
    "contentLabel": "粉彩黃地福壽花盆",
    "styleId": "JSM_6659",
    "contentId": "npm_0377"
  },
  {
    "id": "showcase_18",
    "result": "/images/showcase/20260509_223627/0415_393342_青花四季花卉紋蓋罐_style_PJQ0529.png",
    "styleThumb": "/images/style/PJQ0529.png",
    "contentThumb": "/images/content/npm/0415_393342_青花四季花卉紋蓋罐.jpg",
    "title": "青花四季花卉紋蓋罐 + 碎片 - 姜桥村",
    "styleLabel": "碎片 - 姜桥村",
    "contentLabel": "青花四季花卉紋蓋罐",
    "styleId": "PJQ0529",
    "contentId": "npm_0415"
  },
  {
    "id": "showcase_19",
    "result": "/images/showcase/20260509_223627/0487_557873_白瓷印花螭耳扁壺_style_CZZ_0877.png",
    "styleThumb": "/images/style/CZZ_0877.png",
    "contentThumb": "/images/content/npm/0487_557873_白瓷印花螭耳扁壺.jpg",
    "title": "白瓷印花螭耳扁壺 + 碎片 - 紫竹",
    "styleLabel": "碎片 - 紫竹",
    "contentLabel": "白瓷印花螭耳扁壺",
    "styleId": "CZZ_0877",
    "contentId": "npm_0487"
  },
  {
    "id": "showcase_20",
    "result": "/images/showcase/20260509_223627/0545_933444_青花寶相花紋扁壺_style_DMC_0895.png",
    "styleThumb": "/images/style/DMC_0895.png",
    "contentThumb": "/images/content/npm/0545_933444_青花寶相花紋扁壺.jpg",
    "title": "青花寶相花紋扁壺 + 碎片 - 芒城",
    "styleLabel": "碎片 - 芒城",
    "contentLabel": "青花寶相花紋扁壺",
    "styleId": "DMC_0895",
    "contentId": "npm_0545"
  },
  {
    "id": "showcase_21",
    "result": "/images/showcase/20260509_223627/0598_1712039_霽紅釉膽瓶_style_GHZ0215.png",
    "styleThumb": "/images/style/GHZ0215.png",
    "contentThumb": "/images/content/npm/0598_1712039_霽紅釉膽瓶.jpg",
    "title": "霽紅釉膽瓶 + 碎片 - 合作",
    "styleLabel": "碎片 - 合作",
    "contentLabel": "霽紅釉膽瓶",
    "styleId": "GHZ0215",
    "contentId": "npm_0598"
  },
  {
    "id": "showcase_22",
    "result": "/images/showcase/20260509_223627/0614_1714732_粉彩描金大吉葫蘆式掛屏_style_QSX_0161.png",
    "styleThumb": "/images/style/QSX_0161.png",
    "contentThumb": "/images/content/npm/0614_1714732_粉彩描金大吉葫蘆式掛屏.jpg",
    "title": "粉彩描金大吉葫蘆式掛屏 + 碎片 - 三星村",
    "styleLabel": "碎片 - 三星村",
    "contentLabel": "粉彩描金大吉葫蘆式掛屏",
    "styleId": "QSX_0161",
    "contentId": "npm_0614"
  },
  {
    "id": "showcase_23",
    "result": "/images/showcase/20260509_223627/0738_411014_青花牡丹紋花澆_style_WYF_2179.png",
    "styleThumb": "/images/style/WYF_2179.png",
    "contentThumb": "/images/content/npm/0738_411014_青花牡丹紋花澆.jpg",
    "title": "青花牡丹紋花澆 + 碎片 - 鱼凫村2",
    "styleLabel": "碎片 - 鱼凫村2",
    "contentLabel": "青花牡丹紋花澆",
    "styleId": "WYF_2179",
    "contentId": "npm_0738"
  },
  {
    "id": "showcase_24",
    "result": "/images/showcase/20260509_223627/0760_469970_定窯_白瓷印花鳳紋洗_style_DGS_1309.png",
    "styleThumb": "/images/style/DGS_1309.png",
    "contentThumb": "/images/content/npm/0760_469970_定窯_白瓷印花鳳紋洗.jpg",
    "title": "定窯 白瓷印花鳳紋洗 + 碎片 - 高山",
    "styleLabel": "碎片 - 高山",
    "contentLabel": "定窯 白瓷印花鳳紋洗",
    "styleId": "DGS_1309",
    "contentId": "npm_0760"
  },
  {
    "id": "showcase_25",
    "result": "/images/showcase/20260509_223627/0807_1736571_粉彩花卉紋梅花式盆托_style_CZZ_0851.png",
    "styleThumb": "/images/style/CZZ_0851.png",
    "contentThumb": "/images/content/npm/0807_1736571_粉彩花卉紋梅花式盆托.jpg",
    "title": "粉彩花卉紋梅花式盆托 + 碎片 - 紫竹",
    "styleLabel": "碎片 - 紫竹",
    "contentLabel": "粉彩花卉紋梅花式盆托",
    "styleId": "CZZ_0851",
    "contentId": "npm_0807"
  },
  {
    "id": "showcase_26",
    "result": "/images/showcase/20260509_223627/0826_1828653_白瓷描紅雙龍紋高足碗蓋_style_SK4_1299.png",
    "styleThumb": "/images/style/SK4_1299.png",
    "contentThumb": "/images/content/npm/0826_1828653_白瓷描紅雙龍紋高足碗蓋.jpg",
    "title": "白瓷描紅雙龍紋高足碗蓋 + 碎片 - 三星堆K4",
    "styleLabel": "碎片 - 三星堆K4",
    "contentLabel": "白瓷描紅雙龍紋高足碗蓋",
    "styleId": "SK4_1299",
    "contentId": "npm_0826"
  },
  {
    "id": "showcase_27",
    "result": "/images/showcase/20260509_223627/0879_1078479_粉彩珊瑚紅地事事如意瓷春條_style_GHZ0089.png",
    "styleThumb": "/images/style/GHZ0089.png",
    "contentThumb": "/images/content/npm/0879_1078479_粉彩珊瑚紅地事事如意瓷春條.jpg",
    "title": "粉彩珊瑚紅地事事如意瓷春條 + 碎片 - 合作",
    "styleLabel": "碎片 - 合作",
    "contentLabel": "粉彩珊瑚紅地事事如意瓷春條",
    "styleId": "GHZ0089",
    "contentId": "npm_0879"
  }
];
