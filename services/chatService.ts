// services/chatService.ts
// Qwen3-VL 陶瓷鉴赏 AI 服务

const CHAT_API_URL = '/api/chat';
const MODEL_NAME = 'qwen3-vl-8b';

const SYSTEM_PROMPT = `# Role & Identity
你是一位精通中国古代陶瓷鉴定的考古专家，也是博物馆策展人。你熟悉四川新石器时代至早期青铜时代（古蜀文明早期）的陶器特征。
你的任务是：用简洁、温润、带有古风韵味的文字，为用户的器物图片撰写一段展览名片。语言通俗易懂，不晦涩，不堆砌辞藻。

# Background Knowledge（重要背景）
1. 名称中含"碎片-XX"（如"碎片-01"）的图片，均为出土自【四川宝墩建筑群遗址】的真实考古陶片，距今约4500至3700年，这仅是考古编号，并非器物上刻有文字。
2. 用户会依次输入3张图片：
   - 【图1】：器形参考。
   - 【图2】：胎釉与纹饰参考（宝墩陶片），请仔细观察它的实际颜色、肌理与纹饰特征。
   - 【图3】：最终完整器物，是鉴赏主体。
3. 请将图3视为真实存在的古代器物，不要提及"AI生成"，不要质疑图片真实性。

# Constraints（约束）
1. 每个板块不超过60字，语言简洁，平易近人，有温度感。
2. 禁止使用"AI、算法、像素、生成"等现代词汇。
3. 不要输出思考过程，直接给出正文。
4. 【化生其肤 · 寻脉】中必须根据图2的视觉内容，具体描述其实际颜色（如红褐、灰黑、土黄等）和肌理特征，而非用模糊的泛化描述。

# Output Structure（输出格式）
严格按以下三个标题分块，每块一两句话：

【端正其骨 · 溯形】
（一两句话描写图3的器型轮廓，如口沿、腹部、耳系等特征）

【化生其肤 · 寻脉】
（一两句话描写图3的胎质肌理。必须结合图2的实际颜色与纹样，点名具体色调，指出与宝墩陶片的渊源）

【鉴赏寄语】
（一两句话收尾，点出"大巧若拙"的意境）`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

/**
 * 在浏览器端将 base64 图像缩放到最长边不超过 maxLongSide，
 */
const resizeBase64Image = (
  base64: string,
  maxLongSide: number = 512
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const longSide = Math.max(w, h);
      let newW = w;
      let newH = h;
      if (longSide > maxLongSide) {
        const scale = maxLongSide / longSide;
        newW = Math.round(w * scale);
        newH = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0, newW, newH);
      // 输出 JPEG 以大幅压缩 token 数量
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = reject;
    img.src = `data:image/png;base64,${base64}`;
  });
};

/**
 * 向 Qwen3-VL 发送图片鉴赏请求（非流式）
 */
export const analyzeImage = async (
  imageBase64: string,
  styleImageBase64?: string,
  contentImageBase64?: string,
  userPrompt: string = '请鉴赏这件新生成的陶瓷器物组合。请结合提供的内容图（提供器型特征）和风格图（提供釉色和纹饰特征），用专业语言分析最终生成结果图的器形、釉色、纹饰等特征以及两者的融合效果。'
): Promise<string> => {
  // 发送给 VLM 前将所有图像缩放到最长边 ≤ 512px，避免超出 max_model_len
  const [resizedResult, resizedContent, resizedStyle] = await Promise.all([
    resizeBase64Image(imageBase64),
    contentImageBase64 ? resizeBase64Image(contentImageBase64) : Promise.resolve(undefined),
    styleImageBase64 ? resizeBase64Image(styleImageBase64) : Promise.resolve(undefined),
  ]);

  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: userPrompt },
  ];

  if (resizedContent) {
    userContent.push({ type: 'text', text: '【内容图（器型参考）】' });
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${resizedContent}` },
    });
  }

  if (resizedStyle) {
    userContent.push({ type: 'text', text: '【风格图（釉色纹饰参考）】' });
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${resizedStyle}` },
    });
  }

  userContent.push({ type: 'text', text: '【生成的陶瓷器物图（最终鉴赏对象）】' });
  userContent.push({
    type: 'image_url',
    image_url: { url: `data:image/jpeg;base64,${resizedResult}` },
  });

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: userContent,
    },
  ];

  const payload = {
    model: MODEL_NAME,
    messages,
    temperature: 0.3,
    max_tokens: 2048,
    stream: false,
  };

  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI 服务请求失败 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  let content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 返回内容为空');
  }
  // Strip out thinking process if it exists
  const thinkEnding = '</think>';
  if (content.includes(thinkEnding)) {
    content = content.split(thinkEnding)[1].trim();
  }
  return content;
};

/**
 * 向 Qwen3-VL 发送纯文本对话请求（无图片）
 */
export const chatText = async (userMessage: string): Promise<string> => {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];

  const payload = {
    model: MODEL_NAME,
    messages,
    temperature: 0.5,
    max_tokens: 2048,
    stream: false,
  };

  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI 服务请求失败 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  let content = data?.choices?.[0]?.message?.content ?? '';

  // Strip out thinking process if it exists
  const thinkEnding = '</think>';
  if (content.includes(thinkEnding)) {
    content = content.split(thinkEnding)[1].trim();
  }
  return content;
};
