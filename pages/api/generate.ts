import type { NextApiRequest, NextApiResponse } from 'next';

// Define the request body structure
interface GenerateRequestBody {
  contentImage: string; // Base64 string
  styleImage: string;   // Base64 string
  promptOverride?: string;
}

// Define the Flask response structure
interface FlaskResponse {
  resultImage: string;  // Base64 string
  message?: string;
  error?: string;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase limit for base64 images
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FlaskResponse | { message: string }>
) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // 2. Configure Flask backend URL
    const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:8000/process';
    
    // 3. Get data from request body
    const { contentImage, styleImage, promptOverride } = req.body as GenerateRequestBody;

    // Basic validation
    if (!contentImage || !styleImage) {
      return res.status(400).json({ message: 'Missing contentImage or styleImage' });
    }

    // 4. Forward request to Python Flask backend
    // Note: Style transfer can be slow, handle timeouts if necessary
    const flaskResponse = await fetch(FLASK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentImage,
        styleImage,
        promptOverride
      }),
    });

    // 5. Handle Flask errors
    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text();
      console.error('Flask API Error:', flaskResponse.status, errorText);
      return res.status(flaskResponse.status).json({ 
        message: `Flask Backend Error: ${errorText}` 
      });
    }

    // 6. Get JSON response from Flask
    const data: FlaskResponse = await flaskResponse.json();

    // 7. Return result to frontend
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Next.js API Route Error:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal Server Error during proxying to Flask' 
    });
  }
}
