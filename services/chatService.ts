// services/chatService.ts
// Qwen3-VL 陶瓷鉴赏 AI 服务

const CHAT_API_URL = '/api/chat';
const MODEL_NAME = 'qwen3-vl-8b';

const SYSTEM_PROMPT = `# Role
你是一名博物馆展签撰写者，擅长为文博展示撰写准确、简洁、清楚的说明文字。

# Image Order
用户将提供最多3张图像：
- 图1：器型参考图
- 图2：风格与纹饰参考图
- 图3：最终展示对象（主要描述对象）

# Task
请围绕图3撰写适合博物馆场景的展签文字，并结合图1与图2说明其器型来源和视觉风格来源。

# Writing Rules
1. 语言准确、克制、简洁，像博物馆展签或导览面板，不写散文，不抒情，不拟人。
2. 优先描述图中可见特征，避免空泛评价。
3. 不使用“AI、算法、生成、像素”等词。
4. 不输出思考过程。
5. 图1和图2只是参考来源，图3才是说明主体。
6. 若判断不完全确定，使用“可见”“可辨”“呈现出”“应为”等稳妥表达。
7. 不要在最终输出中出现“图1”“图2”“图3”字样；如需引用参考来源，请直接使用用户提供的名称。
8. 不要输出独立标题行，不要输出类似“【某某器物的当代转译】”这样的首行概括标题。
9. 不要在名称后额外添加“（碎片）”“（参考图）”“（器型）”等括号说明。

# Output Format
严格按以下结构输出：

【器型特征】
40-70字。根据图3并参考图1，描述口沿、腹部、足部、耳系、整体轮廓。

【釉色与纹饰】
50-90字。根据图3并结合图2，描述主要色调、纹样、肌理和装饰分布。

【风格来源说明】
40-70字。说明图2中的哪些视觉特征被转移到了图3上。

【展陈说明】
30-60字。用博物馆说明口吻总结其展示重点。`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

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
      if (!ctx) {
        reject(new Error('canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, newW, newH);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = reject;
    img.src = `data:image/png;base64,${base64}`;
  });
};

const stripLeadingBracketTitle = (content: string): string => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (
    lines.length > 0 &&
    /^【.+】$/.test(lines[0]) &&
    !['【器型特征】', '【釉色与纹饰】', '【风格来源说明】', '【展陈说明】'].includes(lines[0])
  ) {
    lines.shift();
  }

  return lines.join('\n\n');
};

export const analyzeImage = async (
  imageBase64: string,
  styleImageBase64?: string,
  contentImageBase64?: string,
  styleReferenceName?: string,
  contentReferenceName?: string,
  userPrompt: string = '请为这件博物馆展陈对象撰写展签说明。器型参考名称为“未命名器型参考”，风格与纹饰参考名称为“未命名风格参考”，最终展示对象为生成后的完整器物。请在说明中直接使用上述名称，不要使用“图1”“图2”“图3”等指代，也不要在名称后额外添加“（碎片）”“（参考图）”等括号说明。请重点说明最终器物的器型结构、釉色纹饰、风格来源和展陈重点，语言准确、简洁、适合博物馆展示。'
): Promise<string> => {
  const [resizedResult, resizedContent, resizedStyle] = await Promise.all([
    resizeBase64Image(imageBase64),
    contentImageBase64 ? resizeBase64Image(contentImageBase64) : Promise.resolve(undefined),
    styleImageBase64 ? resizeBase64Image(styleImageBase64) : Promise.resolve(undefined),
  ]);

  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: userPrompt },
  ];

  if (resizedContent) {
    userContent.push({
      type: 'text',
      text: `【器型参考：${contentReferenceName || '未命名器型参考'}】`,
    });
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${resizedContent}` },
    });
  }

  if (resizedStyle) {
    userContent.push({
      type: 'text',
      text: `【风格参考：${styleReferenceName || '未命名风格参考'}】`,
    });
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${resizedStyle}` },
    });
  }

  userContent.push({ type: 'text', text: '【最终展陈对象】' });
  userContent.push({
    type: 'image_url',
    image_url: { url: `data:image/jpeg;base64,${resizedResult}` },
  });

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent },
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

  const thinkEnding = '</think>';
  if (content.includes(thinkEnding)) {
    content = content.split(thinkEnding)[1].trim();
  }

  return stripLeadingBracketTitle(content.trim());
};

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

  const thinkEnding = '</think>';
  if (content.includes(thinkEnding)) {
    content = content.split(thinkEnding)[1].trim();
  }

  return stripLeadingBracketTitle(content.trim());
};
