// services/styleTransferService.ts

const API_BASE_URL = 'http://localhost:8000'; // Flask API 地址

export interface GenerationCandidate {
  image: string;      // Base64 string
  params: any;        // 必须保存，用于回传给后端
  debug_info?: string;
}

export interface InteractiveResponse {
  results: GenerationCandidate[];
  tuner_state: {
    center: any;
    sigma: number;
  };
}

/**
 * 将 URL 转换为 Base64
 */
export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
};

/**
 * 重置调参器状态 (Start New Session)
 */
export const resetTuner = async (): Promise<void> => {
  await fetch(`${API_BASE_URL}/interactive/reset`, { method: 'POST' });
};

/**
 * 核心交互生成函数
 * @param styleImage Base64 string
 * @param contentImage Base64 string
 * @param action 'select' | 'reject' | undefined (initial)
 * @param chosenParams 当 action 为 'select' 时必须传入
 */
export const generateInteractive = async (
  styleImage: string,
  contentImage: string,
  action?: 'select' | 'reject',
  chosenParams?: any
): Promise<InteractiveResponse> => {
  
  const payload = {
    styleImage,
    contentImage,
    action,         // 'select', 'reject' or null
    chosen_params: chosenParams,
    batch_size: 2   // 每次生成 2 张供对比
  };

  const response = await fetch(`${API_BASE_URL}/interactive/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Interaction failed');
  }

  return data;
};

export interface AnalysisResult {
  title: string;
  description: string;
  tags: string[];
}

export const analyzeArtifact = async (
  image: string,
  styleDesc: string,
  contentDesc: string
): Promise<AnalysisResult> => {
  const payload = {
    image,
    style_desc: styleDesc,
    content_desc: contentDesc
  };

  const response = await fetch(`${API_BASE_URL}/interactive/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Analysis failed');
  }
  return data;
};