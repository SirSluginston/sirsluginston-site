import { BrandConfig, ProjectConfig, PageConfig, MergedConfig } from '../types/dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
// NOTE: In production, use a backend API instead of exposing credentials in client-side code!
const client = new DynamoDBClient({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: import.meta.env.VITE_AWS_ACCESS_KEY_ID ? {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  } : undefined, // Will use default AWS credentials if not provided (e.g., from AWS CLI)
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'SirSluginstonCo';

const MOCK_BRAND_CONFIG: BrandConfig = {
  ProjectKey: 'SirSluginston',
  PageKey: 'Config',
  Parent: 'SirSluginston Co',
  LogoURL: '/logo.jpg',
  Version: '1.0.0',
  Links: [
    { name: 'Support', url: 'mailto:support@sirsluginston.com', type: 'support' },
    { name: 'GitHub', url: 'https://github.com/sirsluginston', type: 'social' }
  ],
  BrandColor: '#D2691E',
  ProjectColor: '#4B3A78', // Default, usually overridden
  AccentColor: '#FFD700',
  LightColor: '#FFFFF0',
  DarkColor: '#2F2F2F',
  SharedBorderColor: undefined, // Will default to ProjectColor
  FontSans: 'Roboto, sans-serif',
  FontSerif: 'Lora, serif',
  SpaceUnit: 8,
  RadiusMaster: 8,
  DefaultTheme: 'light',
  MetaTags: {
    title: 'SirSluginston Co',
    description: 'Home of innovative projects and solutions',
    keywords: ['sirsluginston', 'projects', 'technology']
  }
};

const MOCK_PROJECT_CONFIG: ProjectConfig = {
  ProjectKey: 'SirSluginston-Site',
  PageKey: 'Config',
  ProjectID: '1',
  ProjectTitle: 'SirSluginston Co.',
  ProjectSlug: 'sirsluginston-site',
  ProjectTagline: 'Home of SirSluginston Co',
  ProjectDescription: 'The main website for SirSluginston Co showcasing all projects and company information.',
  ProjectLogoURL: '/logo.jpg',
  ProjectStatus: 'Active',
  YearCreated: 2020,
  LastUpdated: new Date().toISOString(),
  Version: '1.0.0',
  Links: [
    { name: 'Support', url: 'mailto:support@sirsluginston.com', type: 'support' },
    { name: 'GitHub', url: 'https://github.com/sirsluginston', type: 'social' }
  ],
  ProjectColor: '#4B3A78',
  ProjectOrder: 1,
  ProjectTags: ['website', 'main', 'marketing']
};

const MOCK_PAGES: Record<string, Record<string, PageConfig>> = {
  'SirSluginston-Site': {
    'Home': {
      ProjectKey: 'SirSluginston-Site',
      PageKey: 'Home',
      PageTitle: 'Home',
      PageTagline: 'Home of SirSluginston Co',
      Route: '/',
      Version: '1.0.0',
      InNavbar: true,
      NavbarLabel: 'Home',
      NavbarOrder: 1,
      HasShell: true,
      ContentLayout: {
        type: 'PageContainer',
        children: [
          {
            type: 'Header',
            props: {
              title: 'Welcome to SirSluginston Co',
              subtitle: 'Innovative projects and solutions'
            }
          }
        ]
      }
    },
    'Projects': {
      ProjectKey: 'SirSluginston-Site',
      PageKey: 'Projects',
      PageTitle: 'Projects',
      PageTagline: 'All SirSluginston Co Projects',
      Route: '/projects',
      Version: '1.0.0',
      InNavbar: true,
      NavbarLabel: 'Projects',
      NavbarOrder: 2,
      HasShell: true,
      ContentLayout: {
        type: 'PageContainer',
        children: [
          {
            type: 'Header',
            props: {
              title: 'Projects',
              subtitle: 'All SirSluginston Co Projects'
            }
          }
        ]
      }
    },
    'About': {
      ProjectKey: 'SirSluginston-Site',
      PageKey: 'About',
      PageTitle: 'About',
      PageTagline: 'About SirSluginston Co',
      Route: '/about',
      Version: '1.0.0',
      InNavbar: true,
      NavbarLabel: 'About',
      NavbarOrder: 3,
      HasShell: true
    },
    'Admin': {
      ProjectKey: 'SirSluginston-Site',
      PageKey: 'Admin',
      PageTitle: 'Admin Panel',
      Route: '/admin',
      Version: '1.0.0',
      InNavbar: true,
      NavbarLabel: 'Admin',
      NavbarOrder: 4,
      NavbarRoles: ['Admin'],
      AllowedRoles: ['Admin'],
      HasShell: true
    }
  }
};

/**
 * Fetch Brand-Config from DynamoDB
 * PK: "SirSluginston", SK: "Config"
 */
export async function fetchBrandConfig(): Promise<BrandConfig> {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        ProjectKey: 'SirSluginston',
        PageKey: 'Config',
      },
    });
    
    const result = await docClient.send(command);
    
    if (!result.Item) {
      console.warn('Brand-Config not found in DynamoDB, using fallback');
      return MOCK_BRAND_CONFIG;
    }
    
    return result.Item as BrandConfig;
  } catch (error) {
    console.error('Error fetching Brand-Config:', error);
    // Fallback to mock data if DynamoDB fails
    return MOCK_BRAND_CONFIG;
  }
}

/**
 * Fetch Project-Config from DynamoDB
 * PK: {projectKey}, SK: "Config"
 */
export async function fetchProjectConfig(projectKey: string): Promise<ProjectConfig | null> {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        ProjectKey: projectKey,
        PageKey: 'Config',
      },
    });
    
    const result = await docClient.send(command);
    
    if (!result.Item) {
      return null;
    }
    
    return result.Item as ProjectConfig;
  } catch (error) {
    console.error('Error fetching Project-Config:', error);
    // Fallback to mock if DynamoDB fails
    if (projectKey === 'SirSluginston-Site') {
      return MOCK_PROJECT_CONFIG;
    }
    return null;
  }
}

/**
 * Fetch Page from DynamoDB
 * PK: {projectKey}, SK: {pageKey}
 */
export async function fetchPage(projectKey: string, pageKey: string): Promise<PageConfig | null> {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        ProjectKey: projectKey,
        PageKey: pageKey,
      },
    });
    
    const result = await docClient.send(command);
    
    if (!result.Item) {
      // Fallback to mock data
      const page = MOCK_PAGES[projectKey]?.[pageKey];
      return page || null;
    }
    
    return result.Item as PageConfig;
  } catch (error) {
    console.error('Error fetching Page:', error);
    // Fallback to mock data
    const page = MOCK_PAGES[projectKey]?.[pageKey];
    return page || null;
  }
}

/**
 * Fetch all Project-Config entries (for project listings)
 * Returns all items where PageKey = "Config" and ProjectKey != "SirSluginston"
 * Note: Uses Scan since PageKey is not the partition key. For better performance with many projects,
 * consider adding a GSI (Global Secondary Index) with PageKey as partition key.
 */
export async function fetchAllProjectConfigs(): Promise<ProjectConfig[]> {
  try {
    // Scan table and filter for Config items (excluding Brand-Config)
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'PageKey = :pageKey AND ProjectKey <> :brandKey',
      ExpressionAttributeValues: {
        ':pageKey': 'Config',
        ':brandKey': 'SirSluginston',
      },
    });
    
    const result = await docClient.send(command);
    
    if (result.Items && result.Items.length > 0) {
      return result.Items as ProjectConfig[];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all Project-Configs:', error);
    return [];
  }
}

/**
 * Fetch all pages for a project (for building navbar)
 * PK: {projectKey}, SK: begins_with (any pageKey)
 */
export async function fetchProjectPages(projectKey: string): Promise<PageConfig[]> {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'ProjectKey = :pk',
      ExpressionAttributeValues: {
        ':pk': projectKey,
      },
    });
    
    const result = await docClient.send(command);
    
    if (result.Items && result.Items.length > 0) {
      // Filter out Config items in JavaScript (can't filter primary keys in DynamoDB)
      return result.Items.filter(item => item.PageKey !== 'Config') as PageConfig[];
    }
    
    // Fallback to mock data
    const pages = MOCK_PAGES[projectKey] || {};
    return Object.values(pages);
  } catch (error) {
    console.error('Error fetching Project Pages:', error);
    // Fallback to mock data
    const pages = MOCK_PAGES[projectKey] || {};
    return Object.values(pages);
  }
}

/**
 * Merge 3-tier config: Brand → Project → Page
 */
export function mergeConfigs(
  brand: BrandConfig,
  project: ProjectConfig | null,
  page: PageConfig | null
): MergedConfig {
  // Merge colors: Project overrides Brand
  const mergedColors = {
    brandColor: project?.BrandColor ?? brand.BrandColor,
    projectColor: project?.ProjectColor ?? brand.ProjectColor,
    accentColor: project?.AccentColor ?? brand.AccentColor,
    lightColor: project?.LightColor ?? brand.LightColor,
    darkColor: project?.DarkColor ?? brand.DarkColor,
    sharedBorderColor: project?.SharedBorderColor ?? brand.SharedBorderColor ?? (project?.ProjectColor ?? brand.ProjectColor),
  };

  // Merge links: Project extends/overrides Brand
  const mergedLinks = project?.Links && project.Links.length > 0 
    ? project.Links 
    : brand.Links;

  // Merge roles: Project overrides Brand
  const mergedRoles = {
    allowedRoles: project?.AllowedRoles ?? brand.AllowedRoles,
    deniedRoles: project?.DeniedRoles ?? brand.DeniedRoles,
  };

  // Merge meta tags: Project overrides Brand
  const mergedMetaTags = project?.MetaTags ?? brand.MetaTags;

  return {
    brand: {
      parent: brand.Parent,
      logoURL: brand.LogoURL,
      ...mergedColors,
      fontSans: brand.FontSans,
      fontSerif: brand.FontSerif,
      spaceUnit: brand.SpaceUnit ?? 8,
      radiusMaster: brand.RadiusMaster ?? 8,
      defaultTheme: brand.DefaultTheme,
      links: mergedLinks,
      ...mergedRoles,
      metaTags: mergedMetaTags,
    },
    project: project ? {
      projectKey: project.ProjectKey,
      projectID: project.ProjectID,
      projectTitle: project.ProjectTitle,
      projectSlug: project.ProjectSlug,
      projectTagline: project.ProjectTagline,
      projectDescription: project.ProjectDescription,
      projectLogoURL: project.ProjectLogoURL,
      projectStatus: project.ProjectStatus,
      yearCreated: project.YearCreated,
      projectOrder: project.ProjectOrder,
      projectTags: project.ProjectTags,
    } : {
      projectKey: 'SirSluginston',
      projectID: '0',
      projectTitle: brand.Parent,
      projectSlug: 'sirsluginston',
      projectStatus: 'Active',
      yearCreated: 2020,
    },
    page: page ? {
      pageKey: page.PageKey,
      pageTitle: page.PageTitle,
      pageTagline: page.PageTagline,
      route: page.Route,
      allowedRoles: page.AllowedRoles,
      deniedRoles: page.DeniedRoles,
      hasShell: page.HasShell ?? true,
      shellConfig: page.ShellConfig,
      inNavbar: page.InNavbar ?? true,
      navbarLabel: page.NavbarLabel ?? page.PageTitle,
      navbarOrder: page.NavbarOrder,
      navbarRoles: page.NavbarRoles,
      contentLayout: page.ContentLayout,
      metaTags: page.MetaTags,
    } : {
      pageKey: 'Home',
      pageTitle: 'Home',
      route: '/',
      hasShell: true,
    },
  };
}

/**
 * Apply theme colors to document CSS variables
 */
export function applyTheme(config: MergedConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Set CSS variables
  root.style.setProperty('--brand-color', config.brand.brandColor);
  root.style.setProperty('--project-color', config.brand.projectColor);
  root.style.setProperty('--accent-color', config.brand.accentColor);
  root.style.setProperty('--light-color', config.brand.lightColor);
  root.style.setProperty('--dark-color', config.brand.darkColor);
  root.style.setProperty('--shared-border-color', config.brand.sharedBorderColor);
  
  // Set fonts
  root.style.setProperty('--font-sans', config.brand.fontSans);
  root.style.setProperty('--font-serif', config.brand.fontSerif);
  
  // Set spacing (if needed - these are usually in CSS, but can be overridden)
  root.style.setProperty('--space-unit', `${config.brand.spaceUnit}px`);
  root.style.setProperty('--radius-master', `${config.brand.radiusMaster}px`);
  
  // Apply default theme
  if (config.brand.defaultTheme === 'dark') {
    document.body.classList.add('dark-mode');
  } else if (config.brand.defaultTheme === 'light') {
    document.body.classList.remove('dark-mode');
  }
  // 'auto' uses system preference (handled by CSS/media queries if needed)
}

