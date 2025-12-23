import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Context for hamburger menu control from child pages
export const HamburgerMenuContext = React.createContext<{
  setHamburgerMenu: (menu: { onClick: () => void; visible?: boolean } | null) => void;
}>({ setHamburgerMenu: () => {} });

// Context for page config data
export const PageConfigContext = React.createContext<{
  pageConfig: MergedConfig['page'] | null;
}>({ pageConfig: null });

// Context for admin state
export const AdminContext = React.createContext<{
  isAdmin: boolean;
}>({ isAdmin: false });

const Layout: React.FC<{ 
  children: React.ReactNode; 
  isAdmin?: boolean;
  projectKey?: string; // Default: 'SirSluginston-Site'
}> = ({ children, isAdmin, projectKey = 'SirSluginston-Site' }) => {
  const navigate = useNavigate();
  const [hamburgerMenu, setHamburgerMenu] = useState<{ onClick: () => void; visible?: boolean } | null>(null);
  const [config, setConfig] = useState<MergedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [pages, setPages] = useState<any[]>([]);

  // Fetch and merge configs
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [brand, project, fetchedPages] = await Promise.all([
          fetchBrandConfig(),
          fetchProjectConfig(projectKey),
          fetchProjectPages(projectKey),
        ]);

        setPages(fetchedPages);

        // Find current page based on route
        const currentPage = fetchedPages.find(p => p.Route === window.location.pathname) || fetchedPages[0] || null;

        const merged = mergeConfigs(brand, project, currentPage);
        setConfig(merged);
        applyTheme(merged);
        
        // Set favicon dynamically
        const favicon = document.querySelector('#favicon') as HTMLLinkElement;
        if (favicon) {
          const logoUrl = merged.project.projectLogoURL || merged.brand.logoURL || '/logo.jpg';
          favicon.setAttribute('href', logoUrl);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        // Fallback to basic config
        const brand = await fetchBrandConfig();
        const merged = mergeConfigs(brand, null, null);
        setConfig(merged);
        applyTheme(merged);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [projectKey]);

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
        onClick: () => { window.location.href = page.Route; }
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

  if (loading || !config) {
    return <div>Loading...</div>; // TODO: Add proper loading component
  }

  return (
    <HamburgerMenuContext.Provider value={{ setHamburgerMenu }}>
      <PageConfigContext.Provider value={{ pageConfig: config?.page || null }}>
        <AdminContext.Provider value={{ isAdmin: isAdmin || false }}>
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
        </AdminContext.Provider>
      </PageConfigContext.Provider>
    </HamburgerMenuContext.Provider>
  );
};

export default Layout;
