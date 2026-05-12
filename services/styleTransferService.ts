// services/styleTransferService.ts
// PorcelainAI 风格迁移服务 - 对接 Flask 后端推理管线

// ======================================================================
// 类型定义
// ======================================================================
export interface StyleTransferRequest {
  contentImage: string; // base64 (不含 data URI 前缀)
  styleImage: string;   // base64 (不含 data URI 前缀)
  ipAdapterWeight?: number;
  controlNetWeight?: number;
  denoisingStrength?: number;
  guidanceScale?: number;
}

export interface StyleTransferResponse {
  resultImage: string;  // data URI (data:image/png;base64,...)
  elapsed?: number;     // 耗时（秒）
}

export interface ServerStatus {
  models_ready: boolean;
  loading: boolean;
  error: string | null;
}

// ======================================================================
// 工具函数
// ======================================================================

/**
 * 将 URL 转换为 Base64 data URI 字符串
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

// ======================================================================
// 服务端状态查询
// ======================================================================

/**
 * 健康检查 - 服务是否在运行
 */
export const checkHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * 查询模型加载状态
 */
export const getServerStatus = async (): Promise<ServerStatus> => {
  const res = await fetch('/api/status', { method: 'GET', signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('无法获取服务器状态');
  return res.json();
};

/**
 * 等待模型加载完毕（轮询），返回是否成功
 */
export const waitForModelsReady = async (
  onProgress?: (msg: string) => void,
  maxWaitMs: number = 300_000,
  intervalMs: number = 3000
): Promise<boolean> => {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    try {
      const st = await getServerStatus();
      if (st.models_ready) return true;
      if (st.error) {
        onProgress?.(`模型加载失败: ${st.error}`);
        return false;
      }
      if (st.loading) {
        onProgress?.('模型正在加载中...');
      }
    } catch {
      onProgress?.('等待服务器响应...');
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
};

// ======================================================================
// 核心推理请求
// ======================================================================

/**
 * 调用后端风格迁移推理
 * @param styleImage   风格图 base64（不含 data URI 前缀）
 * @param contentImage 内容图 base64（不含 data URI 前缀）
 * @returns 结果图 data URI 字符串
 */
export const generateStyledPottery = async (
  styleImage: string,
  contentImage: string,
  ipAdapterWeight: number = 0.8946812847064639,
  controlNetWeight: number = 0.9618186968889493,
  denoisingStrength: number = 0.6861563693185955,
  guidanceScale: number = 7.01249745012551
): Promise<string> => {
  const payload: StyleTransferRequest = {
    styleImage,
    contentImage,
    ipAdapterWeight,
    controlNetWeight,
    denoisingStrength,
    guidanceScale,
  };

  // 推理可能耗时较长（30s-120s），使用 5 分钟超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      // 429 = 服务器忙
      if (response.status === 429) {
        throw new Error('服务器忙，另有推理任务正在进行，请稍后重试');
      }
      // 503 = 模型未就绪
      if (response.status === 503) {
        throw new Error('模型尚未加载完毕，请等待模型就绪后再试');
      }
      throw new Error(data.message || '风格迁移失败');
    }

    if (data.elapsed) {
      console.log(`[StyleTransfer] 推理耗时: ${data.elapsed}s`);
    }

    return data.resultImage;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('推理超时（超过 5 分钟），请检查服务器状态');
    }
    console.error('Style Transfer Service Error:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
