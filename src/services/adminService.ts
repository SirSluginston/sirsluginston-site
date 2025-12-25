import { ProjectConfig, PageConfig } from '../types/dynamodb';
import { apiCall } from './apiClient';

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

    await apiCall('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify(updatedConfig),
    });
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

    await apiCall('/api/admin/pages', {
      method: 'POST',
      body: JSON.stringify(updatedConfig),
    });
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
    await apiCall('/api/admin/pages', {
      method: 'DELETE',
      body: JSON.stringify({
        ProjectKey: projectKey,
        PageKey: pageKey,
      }),
    });
  } catch (error) {
    console.error('Error deleting Page Config:', error);
    throw error;
  }
}

