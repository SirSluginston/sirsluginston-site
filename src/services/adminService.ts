import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ProjectConfig, PageConfig } from '../types/dynamodb';

// Reuse the DynamoDB client from configService
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: import.meta.env.VITE_AWS_ACCESS_KEY_ID ? {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  } : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'SirSluginstonCo';

/**
 * Save or update a Project-Config item
 */
export async function saveProjectConfig(config: ProjectConfig): Promise<void> {
  try {
    // Update LastUpdated timestamp
    const updatedConfig = {
      ...config,
      LastUpdated: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: updatedConfig,
      })
    );
  } catch (error) {
    console.error('Error saving Project Config:', error);
    throw error;
  }
}

/**
 * Save or update a Page item
 */
export async function savePageConfig(config: PageConfig): Promise<void> {
  try {
    // Update LastUpdated timestamp
    const updatedConfig = {
      ...config,
      LastUpdated: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: updatedConfig,
      })
    );
  } catch (error) {
    console.error('Error saving Page Config:', error);
    throw error;
  }
}

/**
 * Delete a Page item
 */
export async function deletePageConfig(projectKey: string, pageKey: string): Promise<void> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          ProjectKey: projectKey,
          PageKey: pageKey,
        },
      })
    );
  } catch (error) {
    console.error('Error deleting Page Config:', error);
    throw error;
  }
}

