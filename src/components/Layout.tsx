import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shell, BellIcon, UserIcon } from '@sirsluginston/shared-ui';
import NotificationsDropdown from './NotificationsDropdown';
import {
  fetchBrandConfig,
  fetchProjectConfig,
  fetchProjectPages,
  mergeConfigs,
  applyTheme,
} from '../services/configService';
import { MergedConfig } from '../types/dynamodb';
import { useAuth } from '../contexts/AuthContext';

// Context for hamburger menu control from child pages
export const HamburgerMenuContext = React.createContext<{
  setHamburgerMenu: (menu: { onClick: () => void; visible?: boolean } | null) => void;
}>({ setHamburgerMenu: () => {} });

// Context for page config data
export const PageConfigContext = React.createContext<{
  pageConfig: MergedConfig['page'] | null;
}>({ pageConfig: null });

const Layout: React.FC<{ 
  children: React.ReactNode; 
  projectKey?: string; // Default: 'SirSluginston-Site'
}> = ({ children, projectKey = 'SirSluginston-Site' }) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hamburgerMenu, setHamburgerMenu] = useState<{ onClick: () => void; visible?: boolean } | null>(null);
  // Default config for immediate rendering (shell pre-render)
  const defaultConfig: MergedConfig = {
    brand: {
      parent: 'SirSluginston Co',
      logoURL: '/logo.jpg',
      brandColor: '#D2691E',
      projectColor: '#4B3A78',
      accentColor: '#FFD700',
      lightColor: '#FFFFF0',
      darkColor: '#2F2F2F',
      sharedBorderColor: '#4B3A78',
      fontSans: 'Roboto, sans-serif',
      fontSerif: 'Lora, serif',
      spaceUnit: 8,
      radiusMaster: 8,
      defaultTheme: 'light',
      links: [],
      metaTags: { title: 'SirSluginston Co', description: '', keywords: [] },
    },
    project: {
      projectKey: 'SirSluginston-Site',
      projectID: '1',
      projectTitle: 'SirSluginston Co.',
      projectSlug: 'sirsluginston-site',
      projectStatus: 'Active',
      yearCreated: 2025,
    },
    page: {
      pageKey: 'Home',
      pageTitle: 'Home',
      route: '/',
      hasShell: true,
    },
  };

  const [config, setConfig] = useState<MergedConfig>(defaultConfig);
  const [loading, setLoading] = useState(false); // Start as false to render immediately
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [pages, setPages] = useState<any[]>([]);

  // Fetch and merge configs (non-blocking - render immediately)
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const [brand, project, fetchedPages] = await Promise.all([
          fetchBrandConfig(),
          fetchProjectConfig(projectKey),
          fetchProjectPages(projectKey),
        ]);

        setPages(fetchedPages);

        // Find current page based on route (use React Router location instead of window.location)
        const currentPage = fetchedPages.find(p => p.Route === location.pathname) || fetchedPages[0] || null;

        const merged = mergeConfigs(brand, project, currentPage);
        setConfig(merged);
        applyTheme(merged);
        
        // Update pages state for navbar (already set above, but ensure it's updated)
        setPages(fetchedPages);
        
        // Set favicon dynamically
        const favicon = document.querySelector('#favicon') as HTMLLinkElement;
        if (favicon) {
          const logoUrl = merged.project.projectLogoURL || merged.brand.logoURL || '/logo.jpg';
          favicon.setAttribute('href', logoUrl);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        // Fallback to basic config
        try {
          const brand = await fetchBrandConfig();
          const merged = mergeConfigs(brand, null, null);
          setConfig(merged);
          applyTheme(merged);
        } catch (fallbackError) {
          console.error('Fallback config also failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [projectKey, location.pathname]); // Re-run when route changes

  // Build navbar from pages
  const navItems = React.useMemo(() => {
    if (!pages.length) return [];

    // Filter pages that should be in navbar
    const navbarPages = pages
      .filter(page => {
        // Must have InNavbar = true (defaults to true)
        if (page.InNavbar === false) return false;
        
        // Check NavbarRoles if specified
        if (page.NavbarRoles && page.NavbarRoles.length > 0) {
          // For now, check if user is admin (in production, check actual roles)
          return isAdmin && page.NavbarRoles.includes('Admin');
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by NavbarOrder if specified, otherwise by PageKey
        if (a.NavbarOrder !== undefined && b.NavbarOrder !== undefined) {
          return a.NavbarOrder - b.NavbarOrder;
        }
        return (a.NavbarOrder ?? 999) - (b.NavbarOrder ?? 999);
      })
      .map(page => ({
        label: page.NavbarLabel || page.PageTitle,
        onClick: () => { navigate(page.Route); }
      }));

    return navbarPages;
  }, [pages, isAdmin]);

  // Project logo
  const projectLogo = config?.project.projectLogoURL ? (
    <img 
      src={config.project.projectLogoURL} 
      alt={config.project.projectTitle} 
      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
    />
  ) : null;

  // Icons use CSS variables that automatically update with theme
  const notificationIcon = <BellIcon size={20} color="var(--dark-color)" />;
  const accountIcon = <UserIcon size={24} color="var(--dark-color)" />;

  const handleNotificationClick = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  const handleAccountClick = () => {
    navigate('/account');
  };

  // Always render shell immediately (even with default config)
  // Config will update when data loads, shell will smoothly update

  return (
    <HamburgerMenuContext.Provider value={{ setHamburgerMenu }}>
      <PageConfigContext.Provider value={{ pageConfig: config?.page || null }}>
        <Shell
        projectTitle={config.project.projectTitle}
        projectLogo={projectLogo}
        navItems={navItems}
        hamburgerMenu={hamburgerMenu || undefined}
        notificationIcon={notificationIcon}
        accountIcon={accountIcon}
        onNotificationClick={handleNotificationClick}
        onAccountClick={handleAccountClick}
        footerLinks={config.brand.links?.map(link => ({
          label: link.name,
          url: link.url,
        }))}
        footerYearCreated={config.project.yearCreated}
        footerPoweredBy={config.brand.parent}
        footerStyle={{ background: config.brand.brandColor, color: config.brand.lightColor }}
        onThemeToggle={(darkMode) => {
          document.body.classList.toggle('dark-mode', darkMode);
        }}
      >
        {children}
        <NotificationsDropdown
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      </Shell>
      </PageConfigContext.Provider>
    </HamburgerMenuContext.Provider>
  );
};

export default Layout;
