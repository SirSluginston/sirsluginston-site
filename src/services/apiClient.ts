import { CognitoUserPool } from 'amazon-cognito-identity-js';

const API_URL = import.meta.env.VITE_API_URL || 'https://nfwxo3ux2g.execute-api.us-east-1.amazonaws.com/prod';

const poolData = {
  UserPoolId: 'us-east-1_TNq7tie6D',
  ClientId: '4na5t4a2sar6sn2u90276rofog',
};
const userPool = new CognitoUserPool(poolData);

/**
 * Get current user's JWT token for API authentication
 */
async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session.isValid()) {
        resolve(null);
        return;
      }
      const idToken = session.getIdToken().getJwtToken();
      resolve(idToken);
    });
  });
}

export async function apiCall(endpoint: string, options?: RequestInit): Promise<any> {
  // Get auth token if user is signed in
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const url = `${API_URL}${endpoint}`;
  console.log(`API Call: ${options?.method || 'GET'} ${url}`, { hasToken: !!token });
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        // Show both error and message if available
        if (errorJson.message) {
          errorMessage = `${errorJson.error || errorMessage}: ${errorJson.message}`;
        } else {
          errorMessage = errorJson.error || errorMessage;
        }
      } catch {
        errorMessage = errorText || errorMessage;
      }
      console.error(`API Error: ${url}`, { 
        status: response.status, 
        error: errorMessage,
        responseBody: errorText 
      });
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error: any) {
    // Network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`Network Error: ${url}`, error);
      throw new Error(`Failed to connect to API. Please try again later or contact support if the problem persists.`);
    }
    throw error;
  }
}

