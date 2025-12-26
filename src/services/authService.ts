import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';

// Cognito configuration
const poolData = {
  UserPoolId: 'us-east-1_TNq7tie6D',
  ClientId: '4na5t4a2sar6sn2u90276rofog',
};

const userPool = new CognitoUserPool(poolData);

export interface AuthUser {
  userId: string; // Cognito User ID (sub)
  email: string;
  name?: string; // RealName from Cognito
  groups?: string[];
  isAdmin: boolean;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
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

      cognitoUser.getUserAttributes((err, attributes) => {
        if (err || !attributes) {
          resolve(null);
          return;
        }

        const emailAttr = attributes.find(attr => attr.Name === 'email');
        const nameAttr = attributes.find(attr => attr.Name === 'name');
        
        // Get user groups from JWT token
        const idToken = session.getIdToken();
        const groups = idToken.payload['cognito:groups'] || [];
        const isAdmin = groups.includes('Admin');
        const userId = idToken.payload['sub'] || '';

        resolve({
          userId: userId,
          email: emailAttr?.Value || '',
          name: nameAttr?.Value,
          groups: groups,
          isAdmin: isAdmin,
        });
      });
    });
  });
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthUser> {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            reject(err);
            return;
          }

          const emailAttr = attributes?.find(attr => attr.Name === 'email');
          const nameAttr = attributes?.find(attr => attr.Name === 'name');
          
          const idToken = session.getIdToken();
          const groups = idToken.payload['cognito:groups'] || [];
          const isAdmin = groups.includes('Admin');
          const userId = idToken.payload['sub'] || '';

          resolve({
            userId: userId,
            email: emailAttr?.Value || email,
            name: nameAttr?.Value,
            groups: groups,
            isAdmin: isAdmin,
          });
        });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Sign up new user
 */
export async function signUp(email: string, password: string, name?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const attributes: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ];

    if (name) {
      attributes.push(new CognitoUserAttribute({ Name: 'name', Value: name }));
    }

    userPool.signUp(email, password, attributes, [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
