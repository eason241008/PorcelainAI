import type { VercelRequest, VercelResponse } from '@vercel/node';

// Define the request body structure
interface GenerateRequestBody {
  contentImage: string;
  styleImage: string;
  promptOverride?: string;
  ipAdapterWeight?: number;
  controlNetWeight?: number;
  denoisingStrength?: number;
}

// Define the Flask response structure
interface FlaskResponse {
  resultImage: string;
  message?: string;
  error?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // Flask backend URL — set this in Vercel Environment Variables
    const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:8000/process';

    const { contentImage, styleImage, promptOverride, ipAdapterWeight, controlNetWeight, denoisingStrength } = req.body as GenerateRequestBody;

    if (!contentImage || !styleImage) {
      return res.status(400).json({ message: 'Missing contentImage or styleImage' });
    }

    const flaskResponse = await fetch(FLASK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentImage,
        styleImage,
        promptOverride,
        ipAdapterWeight,
        controlNetWeight,
        denoisingStrength,
      }),
    });

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text();
      console.error('Flask API Error:', flaskResponse.status, errorText);
      return res.status(flaskResponse.status).json({
        message: `Flask Backend Error: ${errorText}`,
      });
    }

    const data: FlaskResponse = await flaskResponse.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Vercel Serverless Function Error:', error);
    return res.status(500).json({
      message: error.message || 'Internal Server Error',
    });
  }
}
