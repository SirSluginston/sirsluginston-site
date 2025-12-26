// Complete Lambda Function - All Endpoints
// ES Module (Node.js 24.x)

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const CONFIG_TABLE = 'SirSluginstonCo';
const USERS_TABLE = 'SirSluginstonUsers';
const USER_ID_KEY = 'UserID'; // Partition key name (capital D)

// Helper to create CORS response
function corsResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

// Helper to extract user info from Cognito token
function getUserFromEvent(event) {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) {
    console.log('No claims found in event.requestContext.authorizer');
    return null;
  }
  
  console.log('Claims found:', Object.keys(claims));
  console.log('User ID (sub):', claims.sub);
  
  const groups = claims['cognito:groups'] || [];
  const isAdmin = groups.includes('Admin');
  
  return {
    userId: claims.sub,
    email: claims.email,
    isAdmin: isAdmin,
  };
}

// Helper to check if user is admin
function requireAdmin(event) {
  const user = getUserFromEvent(event);
  if (!user || !user.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
  return user;
}

// ===== PUBLIC CONFIG ENDPOINTS (No Auth Required) =====

// GET /api/config/brand
async function getBrandConfig(event) {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: CONFIG_TABLE,
        Key: { ProjectKey: 'SirSluginston', PageKey: 'Config' },
      })
    );
    
    if (!result.Item) {
      return corsResponse(404, { error: 'Brand config not found' });
    }
    
    return corsResponse(200, result.Item);
  } catch (error) {
    console.error('Error getting brand config:', error);
    return corsResponse(500, { error: 'Failed to get brand config' });
  }
}

// GET /api/config/projects
async function getAllProjects(event) {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: CONFIG_TABLE,
        FilterExpression: 'begins_with(PageKey, :pageKey)',
        ExpressionAttributeValues: {
          ':pageKey': 'Config',
        },
      })
    );
    
    const projects = (result.Items || [])
      // Filter out brand config (SirSluginston) - only return actual projects
      .filter(item => item.ProjectKey !== 'SirSluginston')
      .map(item => {
        // Return the full config - just copy all attributes from DynamoDB
        const project = { ...item };
        
        // Ensure arrays are arrays (DynamoDB might return undefined)
        if (project.ProjectTags && !Array.isArray(project.ProjectTags)) {
          project.ProjectTags = [];
        }
        if (project.Links && !Array.isArray(project.Links)) {
          project.Links = [];
        }
        
        return project;
      });
    
    return corsResponse(200, projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    return corsResponse(500, { error: 'Failed to get projects' });
  }
}

// GET /api/project/{projectKey}
async function getProjectConfig(event) {
  try {
    const projectKey = event.pathParameters?.projectKey;
    if (!projectKey) {
      return corsResponse(400, { error: 'Project key is required' });
    }
    
    const result = await docClient.send(
      new GetCommand({
        TableName: CONFIG_TABLE,
        Key: { ProjectKey: projectKey, PageKey: 'Config' },
      })
    );
    
    if (!result.Item) {
      return corsResponse(404, { error: 'Project not found' });
    }
    
    return corsResponse(200, result.Item);
  } catch (error) {
    console.error('Error getting project config:', error);
    return corsResponse(500, { error: 'Failed to get project config' });
  }
}

// GET /api/pages/{projectKey}
async function getProjectPages(event) {
  try {
    const projectKey = event.pathParameters?.projectKey;
    if (!projectKey) {
      return corsResponse(400, { error: 'Project key is required' });
    }
    
    const result = await docClient.send(
      new QueryCommand({
        TableName: CONFIG_TABLE,
        KeyConditionExpression: 'ProjectKey = :projectKey',
        ExpressionAttributeValues: {
          ':projectKey': projectKey,
        },
      })
    );
    
    const pages = (result.Items || []).filter(item => item.PageKey !== 'Config');
    
    return corsResponse(200, pages);
  } catch (error) {
    console.error('Error getting project pages:', error);
    return corsResponse(500, { error: 'Failed to get project pages' });
  }
}

// ===== ADMIN ENDPOINTS (Require Admin Auth) =====

// POST /api/admin/projects
async function saveProjectConfig(event) {
  try {
    requireAdmin(event); // Check admin access
    
    const body = JSON.parse(event.body || '{}');
    
    await docClient.send(
      new PutCommand({
        TableName: CONFIG_TABLE,
        Item: {
          ProjectKey: body.ProjectKey,
          PageKey: 'Config',
          ...body,
        },
      })
    );
    
    return corsResponse(200, { success: true });
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      return corsResponse(403, { error: error.message });
    }
    console.error('Error saving project config:', error);
    return corsResponse(500, { error: 'Failed to save project config' });
  }
}

// POST /api/admin/pages
async function savePageConfig(event) {
  try {
    requireAdmin(event); // Check admin access
    
    const body = JSON.parse(event.body || '{}');
    
    await docClient.send(
      new PutCommand({
        TableName: CONFIG_TABLE,
        Item: body,
      })
    );
    
    return corsResponse(200, { success: true });
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      return corsResponse(403, { error: error.message });
    }
    console.error('Error saving page config:', error);
    return corsResponse(500, { error: 'Failed to save page config' });
  }
}

// DELETE /api/admin/projects/{projectKey}
async function deleteProject(event) {
  try {
    requireAdmin(event); // Check admin access
    
    const projectKey = event.pathParameters?.projectKey;
    if (!projectKey) {
      return corsResponse(400, { error: 'Project key is required' });
    }
    
    // Get all pages for this project
    const pagesResult = await docClient.send(
      new QueryCommand({
        TableName: CONFIG_TABLE,
        KeyConditionExpression: 'ProjectKey = :projectKey',
        ExpressionAttributeValues: {
          ':projectKey': projectKey,
        },
      })
    );
    
    // Delete each page
    for (const item of pagesResult.Items || []) {
      await docClient.send(
        new DeleteCommand({
          TableName: CONFIG_TABLE,
          Key: {
            ProjectKey: item.ProjectKey,
            PageKey: item.PageKey,
          },
        })
      );
    }
    
    return corsResponse(200, { success: true });
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      return corsResponse(403, { error: error.message });
    }
    console.error('Error deleting project:', error);
    return corsResponse(500, { error: 'Failed to delete project' });
  }
}

// ===== USER ENDPOINTS (Require Authenticated User) =====

// GET /api/user/settings
async function getUserSettings(event) {
  try {
    const user = getUserFromEvent(event);
    if (!user) {
      return corsResponse(401, { error: 'Unauthorized: Authentication required' });
    }
    
    console.log('Getting user settings for userId:', user.userId);
    console.log('Table name:', USERS_TABLE);
    console.log('Key:', { UserID: user.userId });
    
    const result = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { UserID: user.userId },
      })
    );
    
    if (!result.Item) {
      return corsResponse(404, { error: 'User settings not found' });
    }
    
    return corsResponse(200, result.Item);
  } catch (error) {
    console.error('Error getting user settings:', error);
    return corsResponse(500, { 
      error: 'Failed to get user settings',
      message: error.message
    });
  }
}

// PUT /api/user/settings
async function updateUserSettings(event) {
  try {
    const user = getUserFromEvent(event);
    if (!user) {
      return corsResponse(401, { error: 'Unauthorized: Authentication required' });
    }
    
    const body = JSON.parse(event.body || '{}');
    
    // Get existing user record
    const existing = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { UserID: user.userId },
      })
    );
    
    if (!existing.Item) {
      return corsResponse(404, { error: 'User settings not found' });
    }
    
    // Check DisplayName uniqueness if it's being changed (skip if GSI doesn't exist yet)
    if (body.DisplayName && body.DisplayName !== existing.Item.DisplayName) {
      try {
        const nameCheck = await docClient.send(
          new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'DisplayNameIndex',
            KeyConditionExpression: 'DisplayName = :name',
            ExpressionAttributeValues: {
              ':name': body.DisplayName,
            },
          })
        );
        
        if (nameCheck.Items && nameCheck.Items.length > 0) {
          return corsResponse(400, { error: 'Display name already taken' });
        }
      } catch (gsiError) {
        // GSI might not exist yet - log but don't fail
        console.warn('GSI query failed (might not exist yet):', gsiError.message);
        // Continue without uniqueness check
      }
    }
    
    // Update settings (preserve immutable fields)
    const updated = {
      ...existing.Item,
      ...body,
      UserID: user.userId, // Ensure UserID isn't changed
      RealName: existing.Item.RealName, // Immutable
      Email: existing.Item.Email, // Immutable
      UpdatedAt: new Date().toISOString(),
    };
    
    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: updated,
      })
    );
    
    return corsResponse(200, updated);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return corsResponse(500, { 
      error: 'Failed to update user settings',
      message: error.message
    });
  }
}

// POST /api/user/create
async function createUser(event) {
  try {
    const user = getUserFromEvent(event);
    if (!user) {
      return corsResponse(401, { error: 'Unauthorized: Authentication required' });
    }
    
    const body = JSON.parse(event.body || '{}');
    
    // Check if user already exists
    const existing = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { UserID: user.userId },
      })
    );
    
    if (existing.Item) {
      return corsResponse(200, existing.Item); // Already exists, return it
    }
    
    // Check DisplayName uniqueness (skip if GSI doesn't exist yet)
    if (body.DisplayName) {
      try {
        const nameCheck = await docClient.send(
          new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: 'DisplayNameIndex',
            KeyConditionExpression: 'DisplayName = :name',
            ExpressionAttributeValues: {
              ':name': body.DisplayName,
            },
          })
        );
        
        if (nameCheck.Items && nameCheck.Items.length > 0) {
          return corsResponse(400, { error: 'Display name already taken' });
        }
      } catch (gsiError) {
        // GSI might not exist yet - log but don't fail
        console.warn('GSI query failed (might not exist yet):', gsiError.message);
        // Continue without uniqueness check
      }
    }
    
    // Create new user record with defaults
    const now = new Date().toISOString();
    const newUser = {
      UserID: user.userId,
      Email: body.Email || user.email || '',
      RealName: body.RealName || '',
      DisplayName: body.DisplayName || '',
      AvatarURL: body.AvatarURL || '',
      Timezone: body.Timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      EmailNotifications: body.EmailNotifications !== undefined ? body.EmailNotifications : true,
      MarketingEmails: body.MarketingEmails !== undefined ? body.MarketingEmails : false,
      ProjectUpdates: body.ProjectUpdates !== undefined ? body.ProjectUpdates : true,
      SystemNotifications: body.SystemNotifications !== undefined ? body.SystemNotifications : true,
      ThemePreference: body.ThemePreference || 'auto',
      DateFormat: body.DateFormat || 'MM/DD/YYYY',
      ShowEmailPublicly: body.ShowEmailPublicly !== undefined ? body.ShowEmailPublicly : false,
      AnalyticsOptOut: body.AnalyticsOptOut !== undefined ? body.AnalyticsOptOut : false,
      CreatedAt: now,
      UpdatedAt: now,
    };
    
    await docClient.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: newUser,
      })
    );
    
    return corsResponse(201, newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return corsResponse(500, { 
      error: 'Failed to create user',
      message: error.message,
      stack: error.stack
    });
  }
}

// ===== MAIN HANDLER =====

export const handler = async (event) => {
  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return corsResponse(200, {});
  }
  
  const path = event.path || event.requestContext?.path || '';
  const method = event.httpMethod || event.requestContext?.httpMethod || '';
  
  console.log(`Handling ${method} ${path}`);
  
  try {
    // Public config endpoints (no auth)
    if (path === '/api/config/brand' && method === 'GET') {
      return getBrandConfig(event);
    }
    if (path === '/api/config/projects' && method === 'GET') {
      return getAllProjects(event);
    }
    if (path.startsWith('/api/config/project/') && method === 'GET') {
      return getProjectConfig(event);
    }
    if (path.startsWith('/api/config/pages/') && method === 'GET') {
      return getProjectPages(event);
    }
    
    // Admin endpoints (require admin auth via Cognito authorizer + check)
    if (path === '/api/admin/projects' && method === 'POST') {
      return saveProjectConfig(event);
    }
    if (path === '/api/admin/pages' && method === 'POST') {
      return savePageConfig(event);
    }
    if (path.startsWith('/api/admin/projects/') && method === 'DELETE') {
      return deleteProject(event);
    }
    
    // User endpoints (require authenticated user via Cognito authorizer)
    if (path === '/api/user/settings' && method === 'GET') {
      return getUserSettings(event);
    }
    if (path === '/api/user/settings' && method === 'PUT') {
      return updateUserSettings(event);
    }
    if (path === '/api/user/create' && method === 'POST') {
      return createUser(event);
    }
    
    return corsResponse(404, { error: 'Not found' });
  } catch (error) {
    console.error('Handler error:', error);
    return corsResponse(500, { error: 'Internal server error', message: error.message });
  }
};

