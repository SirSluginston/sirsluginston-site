import React, { useState, useEffect, useRef } from 'react';
import { PageContainer, Header, GridLayout, Card, Sidebar, MobileMenu, Button } from '@sirsluginston/shared-ui';
import { projectStatusOptions } from '../config';
import { HamburgerMenuContext, PageConfigContext } from '../components/Layout';
import { renderContentLayout } from '../components/ComponentRenderer';
import { fetchAllProjectConfigs } from '../services/configService';
import { ProjectConfig } from '../types/dynamodb';

const SIDEBAR_WIDTH = 188;
const GRID_MAX_WIDTH = 900;
const SIDEBAR_GAP = 32;

const Projects: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarTop, setSidebarTop] = useState<number>(0);
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);
  const { setHamburgerMenu } = React.useContext(HamburgerMenuContext);
  const { pageConfig } = React.useContext(PageConfigContext);
  const pageTitle = pageConfig?.pageTitle || 'Projects';
  const pageTagline = pageConfig?.pageTagline || 'All SirSluginston Co. Projects';

  // Fetch all projects from DynamoDB
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectConfigs = await fetchAllProjectConfigs();
        // Sort by ProjectOrder if available, otherwise by ProjectID
        const sorted = projectConfigs.sort((a, b) => {
          if (a.ProjectOrder !== undefined && b.ProjectOrder !== undefined) {
            return a.ProjectOrder - b.ProjectOrder;
          }
          // Fallback to ProjectID comparison (handle numeric strings)
          const aId = parseFloat(a.ProjectID) || 0;
          const bId = parseFloat(b.ProjectID) || 0;
          return aId - bId;
        });
        setProjects(sorted);
        console.log('Loaded projects from DynamoDB:', sorted);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1060);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Register hamburger menu with Layout
  useEffect(() => {
    setHamburgerMenu({
      onClick: () => setShowSidebar(!showSidebar),
      visible: isMobile, // Only show on mobile
    });
    return () => setHamburgerMenu(null); // Cleanup on unmount
  }, [isMobile, showSidebar, setHamburgerMenu]);

  const filtered = statusFilter ? projects.filter(p => p.ProjectStatus === statusFilter) : projects;

  // Note: Projects page has complex sidebar logic with filtering, so we keep it hardcoded for now
  // ContentLayout from DB would need to support interactive components and state management
  // For now, we skip ContentLayout for Projects page to preserve sidebar functionality

  // Measure header height to align sidebar with cards
  useEffect(() => {
    if (!isMobile && headerRef.current) {
      const updateSidebarTop = () => {
        const headerHeight = headerRef.current?.offsetHeight || 0;
        // Add a small gap after header (typically the spacing before grid starts)
        setSidebarTop(headerHeight + 24);
      };
      updateSidebarTop();
      window.addEventListener('resize', updateSidebarTop);
      return () => window.removeEventListener('resize', updateSidebarTop);
    }
  }, [isMobile, statusFilter]);

  // Calculate sidebar position to align with grid cards (not header)
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridLayoutRef = useRef<HTMLDivElement>(null);
  const [sidebarPosition, setSidebarPosition] = useState({ top: 0, left: 0, scrollY: 0 });
  const initialGridTopRef = useRef<number>(0);

  useEffect(() => {
    if (!isMobile && gridLayoutRef.current) {
      const updateSidebarPosition = () => {
        const gridRect = gridLayoutRef.current?.getBoundingClientRect();
        const scrollY = window.scrollY;
        
        if (gridRect) {
          const leftMargin = (window.innerWidth - GRID_MAX_WIDTH) / 2;
          const sidebarLeft = Math.max(16, leftMargin - SIDEBAR_WIDTH - SIDEBAR_GAP);
          
          // Store initial grid top position on first render
          if (initialGridTopRef.current === 0) {
            initialGridTopRef.current = gridRect.top + scrollY;
          }
          
          // Sticky offset (below navbar, accounting for navbar height)
          const stickyOffset = 120;
          
          // Grid's current position relative to viewport
          const gridTopRelative = gridRect.top;
          
          // Calculate final top: 
          // - If grid hasn't scrolled past sticky point, align with grid
          // - Once grid scrolls up past sticky point, make sidebar sticky
          const finalTop = gridTopRelative < stickyOffset 
            ? stickyOffset 
            : gridRect.top + scrollY;
          
          setSidebarPosition({
            top: finalTop,
            left: sidebarLeft,
            scrollY,
          });
        }
      };
      
      // Use requestAnimationFrame for smooth updates
      let rafId: number;
      const handleUpdate = () => {
        rafId = requestAnimationFrame(updateSidebarPosition);
      };
      
      updateSidebarPosition();
      window.addEventListener('resize', handleUpdate);
      window.addEventListener('scroll', handleUpdate, { passive: true });
      
      return () => {
        window.removeEventListener('resize', handleUpdate);
        window.removeEventListener('scroll', handleUpdate);
        if (rafId) cancelAnimationFrame(rafId);
        initialGridTopRef.current = 0; // Reset on unmount
      };
    }
  }, [isMobile, statusFilter]);

  return (
    <PageContainer>
      {/* Mobile sidebar overlay - using SharedUI MobileMenu component */}
      <MobileMenu isOpen={isMobile && showSidebar} onClose={() => setShowSidebar(false)} width={SIDEBAR_WIDTH}>
        <Sidebar width={`${SIDEBAR_WIDTH}px`} style={{ border: 'none', background: 'transparent', padding: 0 }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: 'var(--space-md)', 
            color: 'var(--dark-color)',
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
          }}>
            Filter by Status
          </h3>
          {projectStatusOptions.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              style={{
                display: 'block',
                width: '100%',
                padding: 'var(--space-sm) var(--space-md)',
                marginBottom: 'var(--space-xs)',
                textAlign: 'left',
                background: statusFilter === status ? 'var(--accent-color)' : 'var(--light-color)',
                color: statusFilter === status ? 'var(--light-color)' : 'var(--dark-color)',
                border: '2.5px solid var(--shared-border-color)',
                borderRadius: 'var(--radius-master)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                boxShadow: statusFilter === status ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (statusFilter !== status) {
                  e.currentTarget.style.background = 'var(--accent-color)';
                  e.currentTarget.style.color = 'var(--light-color)';
                }
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== status) {
                  e.currentTarget.style.background = 'var(--light-color)';
                  e.currentTarget.style.color = 'var(--dark-color)';
                }
              }}
            >
              {status}
            </button>
          ))}
        </Sidebar>
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <Button 
            label="Close" 
            onClick={() => setShowSidebar(false)}
            variant="outline"
          />
        </div>
      </MobileMenu>

      {/* Desktop: Sidebar positioned in margin, Grid centered */}
      {!isMobile && (
        <>
          {/* Sidebar - Fixed with smooth scroll behavior */}
          <div
            style={{
              position: 'fixed',
              top: `${sidebarPosition.top}px`,
              left: `${sidebarPosition.left}px`,
              width: SIDEBAR_WIDTH,
              zIndex: 10,
              transition: 'top 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease-out',
              boxShadow: sidebarPosition.scrollY > 200 
                ? '0 4px 12px rgba(0,0,0,0.08)' 
                : 'none',
            }}
          >
            <Sidebar width={`${SIDEBAR_WIDTH}px`}>
              <h3 style={{ marginTop: 0, marginBottom: 'var(--space-md)', color: 'var(--dark-color)' }}>Filter by Status</h3>
              {projectStatusOptions.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 'var(--space-sm)',
                    marginBottom: 'var(--space-xs)',
                    textAlign: 'left',
                    background: statusFilter === status ? 'var(--accent-color)' : 'none',
                    color: statusFilter === status ? 'var(--light-color)' : 'var(--dark-color)',
                    border: 'none',
                    borderRadius: 'var(--radius-master)',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  {status}
                </button>
              ))}
            </Sidebar>
          </div>
          
          {/* Centered grid container */}
          <div
            ref={gridContainerRef}
            style={{
              maxWidth: GRID_MAX_WIDTH,
              width: '100%',
              margin: '0 auto',
              padding: '0 28px',
            }}
          >
            <div ref={headerRef}>
              <Header title={pageTitle} subtitle={pageTagline} />
            </div>
            <div ref={gridLayoutRef}>
              <GridLayout columns={2} gap="2rem">
              {loading && (
                <p style={{ gridColumn: '1 / -1', color: '#888' }}>Loading projects...</p>
              )}
              {!loading && filtered.length === 0 && (
                <p style={{ gridColumn: '1 / -1', color: '#888' }}>No projects with that status.</p>
              )}
              {!loading && filtered.map((proj) => (
                <Card key={proj.ProjectKey} title={proj.ProjectTitle}>
                  <div>{proj.ProjectTagline || proj.ProjectDescription || ''}</div>
                  <div style={{marginTop: 8, fontWeight: 'bold', color: proj.ProjectColor || '#684522'}}>
                    {proj.ProjectStatus}
                  </div>
                </Card>
              ))}
              </GridLayout>
            </div>
          </div>
        </>
      )}

      {/* Mobile: just the grid, no sidebar */}
      {isMobile && (
        <div style={{
          maxWidth: GRID_MAX_WIDTH,
          margin: '0 auto',
          padding: '0 28px',
        }}>
          <Header title="Projects" subtitle="All SirSluginston Co. Projects" />
          <GridLayout columns={2} gap="2rem">
            {loading && (
              <p style={{ gridColumn: '1 / -1', color: '#888' }}>Loading projects...</p>
            )}
            {!loading && filtered.length === 0 && (
              <p style={{ gridColumn: '1 / -1', color: '#888' }}>No projects with that status.</p>
            )}
            {!loading && filtered.map((proj) => (
              <Card key={proj.ProjectKey} title={proj.ProjectTitle}>
                <div>{proj.ProjectTagline || proj.ProjectDescription || ''}</div>
                <div style={{marginTop: 8, fontWeight: 'bold', color: proj.ProjectColor || '#684522'}}>
                  {proj.ProjectStatus}
                </div>
              </Card>
            ))}
          </GridLayout>
        </div>
      )}
    </PageContainer>
  );
};

export default Projects;
