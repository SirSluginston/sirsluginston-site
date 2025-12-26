import { apiCall } from './apiClient';

export interface UserSettings {
  UserId: string;
  Email: string;
  RealName: string;
  DisplayName: string;
  AvatarURL?: string;
  Timezone?: string;
  EmailNotifications: boolean;
  MarketingEmails: boolean;
  ProjectUpdates: boolean;
  SystemNotifications: boolean;
  ThemePreference: 'light' | 'dark' | 'auto';
  DateFormat?: string;
  ShowEmailPublicly: boolean;
  AnalyticsOptOut: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

/**
 * Get current user's settings from DynamoDB
 */
export async function getUserSettings(): Promise<UserSettings | null> {
  try {
    const settings = await apiCall('/api/user/settings', { method: 'GET' });
    return settings as UserSettings;
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('not found')) {
      return null; // User settings don't exist yet
    }
    throw error;
  }
}

/**
 * Update user settings in DynamoDB
 */
export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const updated = await apiCall('/api/user/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  return updated as UserSettings;
}

/**
 * Create user record in DynamoDB (called after email verification)
 */
export async function createUserRecord(data: {
  Email: string;
  RealName: string;
  DisplayName: string;
}): Promise<UserSettings> {
  const user = await apiCall('/api/user/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return user as UserSettings;
}

