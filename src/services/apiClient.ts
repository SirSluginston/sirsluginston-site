const API_URL = import.meta.env.VITE_API_URL || 'https://nfwxo3ux2g.execute-api.us-east-1.amazonaws.com/prod';

export async function apiCall(endpoint: string, options?: RequestInit): Promise<any> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API call failed: ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

