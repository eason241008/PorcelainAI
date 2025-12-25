// services/styleTransferService.ts

export interface StyleTransferRequest {
  contentImage: string; // base64 without prefix usually, or handle in API
  styleImage: string;   // base64
  promptOverride?: string;
}

export interface StyleTransferResponse {
  resultImage: string;
}

/**
 * Converts a URL to a Base64 string
 */
export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Keep the prefix (data:image/...) as the backend might expect it or strip it there.
        // Based on App.tsx usage, it splits the result (result.split(',')[1]), 
        // so returning full data URL is correct here.
        resolve(result); 
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
};

/**
 * Calls the Next.js API route to perform style transfer
 * Matches the signature expected by App.tsx: (styleBase64, contentBase64)
 */
export const generateStyledPottery = async (
  styleImage: string,
  contentImage: string
): Promise<string> => {
  try {
    // Construct payload. 
    // App.tsx passes base64 strings.
    // The API /api/generate expects { contentImage, styleImage }
    
    const payload: StyleTransferRequest = {
      styleImage,
      contentImage,
    };

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to process image');
    }

    // Return the result image (Base64)
    // Flask usually returns "data:image/png;base64,..." or just base64.
    // If it's just base64, we might want to ensure prefix if the UI expects it.
    // But let's assume the backend returns a displayable string or App handles it.
    // Looking at App.tsx: <img src={resultImage} ... /> -> needs data URI prefix if it's raw base64.
    // The previous code in generate.ts returned data.resultImage directly.
    
    return data.resultImage;
  } catch (error) {
    console.error('Service Error:', error);
    throw error;
  }
};
