// DynamoDB Schema Type Definitions
// PK = ProjectKey, SK = PageKey

export interface Link {
  name: string;
  icon?: string;
  url: string;
  type?: 'support' | 'social' | 'legal' | string;
}

export interface MetaTags {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
}

// Brand-Config: PK = "SirSluginston", SK = "Config"
export interface BrandConfig {
  // Keys
  ProjectKey: 'SirSluginston';
  PageKey: 'Config';
  
  // Core Brand Identity
  Parent: string; // e.g., "SirSluginston Co"
  LogoURL: string;
  Version: string;
  
  // Links
  Links?: Link[];
  
  // Color System (Defaults)
  BrandColor: string;
  ProjectColor: string; // Default secondary/project color (usually overridden)
  AccentColor: string;
  LightColor: string;
  DarkColor: string;
  SharedBorderColor?: string;
  
  // Typography
  FontSans: string;
  FontSerif: string;
  
  // Spacing System
  SpaceUnit?: number; // Default: 8
  RadiusMaster?: number; // Default: 8
  
  // Theme
  DefaultTheme?: 'light' | 'dark' | 'auto';
  
  // Access Control
  AllowedRoles?: string[];
  DeniedRoles?: string[];
  
  // SEO
  MetaTags?: MetaTags;
}

// Project-Config: PK = {ProjectKey}, SK = "Config"
export interface ProjectConfig {
  // Keys
  ProjectKey: string;
  PageKey: 'Config';
  
  // Project Identity
  ProjectID: string; // Can be "1", "2", "0.5", etc.
  ProjectTitle: string;
  ProjectSlug: string;
  ProjectTagline?: string;
  ProjectDescription?: string;
  ProjectLogoURL?: string;
  ProjectStatus: 'Active' | 'Maintenance' | 'Coming Soon' | 'Archived';
  YearCreated: number;
  LastUpdated: string; // ISO 8601
  Version: string;
  
  // Links
  Links?: Link[];
  
  // Color System (Overrides)
  BrandColor?: string;
  ProjectColor: string; // Required - primary project color
  AccentColor?: string;
  LightColor?: string;
  DarkColor?: string;
  SharedBorderColor?: string;
  
  // Display & Organization
  ProjectOrder?: number;
  ProjectTags?: string[];
  
  // Access Control
  AllowedRoles?: string[];
  DeniedRoles?: string[];
  
  // SEO
  MetaTags?: MetaTags;
}

// Component Tree Node for ContentLayout
export interface ComponentTreeNode {
  type: string; // Component name (e.g., "PageContainer", "Header", "GridLayout", "Card", "text")
  props?: Record<string, any>;
  children?: ComponentTreeNode[];
  content?: string; // For text nodes
}

// Shell Configuration
export interface ShellConfig {
  showLogo?: boolean;
  showNavbar?: boolean;
  showFooter?: boolean;
  showThemeToggle?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  showAccount?: boolean;
}

// Page: PK = {ProjectKey}, SK = {PageKey}
export interface PageConfig {
  // Keys
  ProjectKey: string;
  PageKey: string;
  
  // Page Identity
  PageTitle: string;
  PageTagline?: string;
  Route: string;
  Version: string;
  
  // Access Control
  AllowedRoles?: string[];
  DeniedRoles?: string[];
  
  // Shell Configuration
  HasShell?: boolean; // Default: true
  ShellConfig?: ShellConfig;
  
  // Navigation
  InNavbar?: boolean; // Default: true
  NavbarLabel?: string; // Defaults to PageTitle
  NavbarOrder?: number;
  NavbarRoles?: string[]; // Roles that can see this in navbar
  
  // Content Layout
  ContentLayout?: ComponentTreeNode;
  
  // SEO & Metadata
  MetaTags?: MetaTags;
  LastUpdated?: string; // ISO 8601
}

// Merged Config (result of 3-tier merge)
export interface MergedConfig {
  // From Brand + Project merge
  brand: {
    parent: string;
    logoURL: string;
    brandColor: string;
    projectColor: string;
    accentColor: string;
    lightColor: string;
    darkColor: string;
    sharedBorderColor: string;
    fontSans: string;
    fontSerif: string;
    spaceUnit: number;
    radiusMaster: number;
    defaultTheme?: 'light' | 'dark' | 'auto';
    links?: Link[];
    allowedRoles?: string[];
    deniedRoles?: string[];
    metaTags?: MetaTags;
  };
  
  // From Project
  project: {
    projectKey: string;
    projectID: string;
    projectTitle: string;
    projectSlug: string;
    projectTagline?: string;
    projectDescription?: string;
    projectLogoURL?: string;
    projectStatus: string;
    yearCreated: number;
    projectOrder?: number;
    projectTags?: string[];
  };
  
  // From Page
  page: {
    pageKey: string;
    pageTitle: string;
    pageTagline?: string;
    route: string;
    allowedRoles?: string[];
    deniedRoles?: string[];
    hasShell: boolean;
    shellConfig?: ShellConfig;
    inNavbar?: boolean;
    navbarLabel?: string;
    navbarOrder?: number;
    navbarRoles?: string[];
    contentLayout?: ComponentTreeNode;
    metaTags?: MetaTags;
  };
}

