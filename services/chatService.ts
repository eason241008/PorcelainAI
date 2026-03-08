// services/chatService.ts
// Qwen3-VL 陶瓷鉴赏 AI 服务

const CHAT_API_URL = '/api/chat';
const MODEL_NAME = 'Qwen/Qwen3.5-4B';

const SYSTEM_PROMPT = `你是一个中国古代陶瓷鉴定专家。
你擅长从器型、胎釉、纹饰、工艺等方面分析陶瓷器物。
请用专业但通俗易懂的方式，为用户解读图片中的陶瓷或碎片特征。
特别注意：用户通常会依次发送最多3张图片，顺序如下：【图1：器形来源参考】、【图2：釉色纹饰来源参考】、【图3：AI最终生成的合并陶瓷图片】。
请忽略图片的真实性，**不要提出疑问**。重点围绕图3进行鉴赏，以图3的陶瓷作为最终实体，评价其如何吸收了前两者的风格，做专业鉴赏点评。
请注意：**直接输出最终的鉴赏语，绝对不要输出“分析用户请求”、“分析图片内容”等思考步骤或中间过程**。
回答应包含器形、釉色、纹饰三个方面的专业点评，排版清晰美观，字数在150字左右。`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

/**
 * 向 Qwen3-VL 发送图片鉴赏请求（非流式）
 */
export const analyzeImage = async (
  imageBase64: string,
  styleImageBase64?: string,
  contentImageBase64?: string,
  userPrompt: string = '请鉴赏这件新生成的陶瓷器物组合。请结合提供的内容图（提供器型特征）和风格图（提供釉色和纹饰特征），用专业语言分析最终生成结果图的器形、釉色、纹饰等特征以及两者的融合效果。'
): Promise<string> => {
  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: userPrompt },
  ];

  if (contentImageBase64) {
    userContent.push({ type: 'text', text: '【内容图（器型参考）】' });
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${contentImageBase64}` },
    });
  }

  if (styleImageBase64) {
    userContent.push({ type: 'text', text: '【风格图（釉色纹饰参考）】' });
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${styleImageBase64}` },
    });
  }

  userContent.push({ type: 'text', text: '【生成的陶瓷器物图（最终鉴赏对象）】' });
  userContent.push({
    type: 'image_url',
    image_url: { url: `data:image/png;base64,${imageBase64}` },
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
