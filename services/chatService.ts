// services/chatService.ts
// Qwen3-VL 陶瓷鉴赏 AI 服务

const CHAT_API_URL = '/api/chat';
const MODEL_NAME = 'qwen3-vl-8b';

const SYSTEM_PROMPT = `你是一个中国古代陶瓷鉴定专家。
你擅长从器型、胎釉、纹饰、工艺等方面分析陶瓷器物。
请用专业但通俗易懂的方式，为用户解读图片中的陶瓷或碎片特征。
回答应简洁精炼，约100-200字。`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

/**
 * 向 Qwen3-VL 发送图片鉴赏请求（非流式）
 */
export const analyzeImage = async (
  imageBase64: string,
  userPrompt: string = '请鉴赏这件陶瓷器物，分析它的器形、釉色、纹饰等特征。'
): Promise<string> => {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`,
          },
        },
      ],
    },
  ];

  const payload = {
    model: MODEL_NAME,
    messages,
    temperature: 0.3,
    max_tokens: 512,
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
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI 返回内容为空');
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
    max_tokens: 512,
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
  return data?.choices?.[0]?.message?.content ?? '';
};
