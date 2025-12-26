import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Header, GridLayout, Card, Sidebar, SidebarItem, MobileMenu, Button } from '@sirsluginston/shared-ui';
import { projectStatusOptions } from '../config';
import { HamburgerMenuContext, PageConfigContext } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { renderContentLayout } from '../components/ComponentRenderer';
import { fetchAllProjectConfigs } from '../services/configService';
import { ProjectConfig } from '../types/dynamodb';
import { ProjectEditModal } from '../components/ProjectEditModal';
import { ProjectCreateModal } from '../components/ProjectCreateModal';

const SIDEBAR_WIDTH = 188;
const GRID_MAX_WIDTH = 900;
const SIDEBAR_GAP = 32;

const Projects: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarTop, setSidebarTop] = useState<number>(0);
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectConfig | null>(null);
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const { setHamburgerMenu } = React.useContext(HamburgerMenuContext);
  const { pageConfig } = React.useContext(PageConfigContext);
  const { isAdmin } = useAuth();
  const pageTitle = pageConfig?.pageTitle || 'Projects';
  const pageTagline = pageConfig?.pageTagline || 'All SirSluginston Co. Projects';

  // Check dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Fetch all projects from DynamoDB
  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectConfigs = await fetchAllProjectConfigs();
      // Filter out brand config (shouldn't be returned, but double-check)
      const filtered = projectConfigs.filter(p => p.ProjectKey !== 'SirSluginston');
      // Sort by ProjectOrder if available, otherwise by ProjectID
      const sorted = filtered.sort((a, b) => {
        // Both have ProjectOrder - use that
        if (a.ProjectOrder !== undefined && b.ProjectOrder !== undefined) {
          return a.ProjectOrder - b.ProjectOrder;
        }
        // Only one has ProjectOrder - prioritize it
        if (a.ProjectOrder !== undefined) return -1;
        if (b.ProjectOrder !== undefined) return 1;
        // Neither has ProjectOrder - fallback to ProjectID
        const aId = parseFloat(a.ProjectID) || 0;
        const bId = parseFloat(b.ProjectID) || 0;
        return aId - bId;
      });
      setProjects(sorted);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Get all unique tags from projects
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    projects.forEach(proj => {
      if (proj.ProjectTags) {
        proj.ProjectTags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [projects]);

  // Filter projects by status and/or tag
  const filtered = React.useMemo(() => {
    return projects.filter(p => {
      if (statusFilter && p.ProjectStatus !== statusFilter) return false;
      if (tagFilter && (!p.ProjectTags || !p.ProjectTags.includes(tagFilter))) return false;
      return true;
    });
  }, [projects, statusFilter, tagFilter]);

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
  }, [isMobile, statusFilter, tagFilter]);

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
  }, [isMobile, statusFilter, tagFilter]);

  return (
    <PageContainer>
      {/* Mobile sidebar overlay - using SharedUI MobileMenu component */}
      <MobileMenu isOpen={isMobile && showSidebar} onClose={() => setShowSidebar(false)} width={SIDEBAR_WIDTH}>
        <Sidebar width={`${SIDEBAR_WIDTH}px`} style={{ border: 'none', background: 'transparent', padding: 0 }}>
          {isAdmin && (
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <Button
                label="New Project"
                variant="primary"
                onClick={() => setCreateModalOpen(true)}
                style={{ width: '100%' }}
              />
            </div>
          )}
          
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: 'var(--space-md)', 
            color: 'var(--dark-color)',
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
          }}>
            Filter
          </h3>
          
          <h4 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', color: 'var(--dark-color)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 'bold', opacity: 0.8 }}>Status</h4>
          {projectStatusOptions.map(status => (
            <SidebarItem
              key={status}
              selected={statusFilter === status}
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
            >
              {status}
            </SidebarItem>
          ))}
          
          {allTags.length > 0 && (
            <>
              <h4 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', color: 'var(--dark-color)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 'bold', opacity: 0.8 }}>Tags</h4>
              {allTags.map(tag => (
                <SidebarItem
                  key={tag}
                  selected={tagFilter === tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                >
                  {tag}
                </SidebarItem>
              ))}
            </>
          )}
          
          {(statusFilter || tagFilter) && (
            <Button
              label="Reset Filters"
              variant="outline"
              onClick={() => {
                setStatusFilter(null);
                setTagFilter(null);
              }}
              style={{
                marginTop: 'var(--space-md)',
                width: '100%',
              }}
            />
          )}
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
              {isAdmin && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <Button
                    label="New Project"
                    variant="primary"
                    onClick={() => setCreateModalOpen(true)}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
              
              <h3 style={{ marginTop: 0, marginBottom: 'var(--space-md)', color: 'var(--dark-color)', fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>Filter</h3>
              
              <h4 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', color: 'var(--dark-color)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 'bold', opacity: 0.8 }}>Status</h4>
              {projectStatusOptions.map(status => (
                <SidebarItem
                  key={status}
                  selected={statusFilter === status}
                  onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                >
                  {status}
                </SidebarItem>
              ))}
              
              {allTags.length > 0 && (
                <>
                  <h4 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)', color: 'var(--dark-color)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 'bold', opacity: 0.8 }}>Tags</h4>
                  {allTags.map(tag => (
                    <SidebarItem
                      key={tag}
                      selected={tagFilter === tag}
                      onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                    >
                      {tag}
                    </SidebarItem>
                  ))}
                </>
              )}
              
              {(statusFilter || tagFilter) && (
                <Button
                  label="Reset Filters"
                  variant="outline"
                  onClick={() => {
                    setStatusFilter(null);
                    setTagFilter(null);
                  }}
                  style={{
                    marginTop: 'var(--space-md)',
                    width: '100%',
                  }}
                />
              )}
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
              {!loading && filtered.map((proj) => {
                const hasLogo = proj.ProjectLogoURL;
                // Helper to add opacity to hex color
                const addOpacity = (color: string, opacity: number) => {
                  if (!color) return '';
                  const hex = color.replace('#', '');
                  const r = parseInt(hex.substr(0, 2), 16);
                  const g = parseInt(hex.substr(2, 2), 16);
                  const b = parseInt(hex.substr(4, 2), 16);
                  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                };
                return (
                  <Card 
                    key={proj.ProjectKey} 
                    style={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      padding: 'var(--space-md)',
                      border: `2.5px solid ${proj.ProjectColor || 'var(--shared-border-color)'}`,
                      boxShadow: proj.ProjectColor 
                        ? `0 0 8px ${addOpacity(proj.ProjectColor, 0.25)}, 0 0 4px rgba(255, 255, 240, 0.3)`
                        : 'none',
                    }}
                    onClick={() => {
                      // Navigate to project home page (would be /projects/{projectKey} or similar)
                      // For now, just log - will implement navigation later
                      console.log('Navigate to project:', proj.ProjectKey);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Custom header with logo and title */}
                    <div style={{
                      marginTop: 0,
                      marginBottom: 0,
                      borderBottom: `2.5px solid ${proj.ProjectColor || 'var(--shared-border-color)'}`,
                      paddingBottom: 'var(--space-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                    }}>
                      {hasLogo && (
                        <div style={{ 
                          width: '56px',
                          height: '56px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          borderRadius: 'var(--radius-master)',
                          background: 'var(--light-color)',
                          border: `2.5px solid ${proj.ProjectColor || 'var(--shared-border-color)'}`,
                          padding: '4px',
                          marginRight: 'var(--space-sm)',
                        }}>
                          <img 
                            src={proj.ProjectLogoURL} 
                            alt={proj.ProjectTitle}
                            style={{ 
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain' 
                            }} 
                          />
                        </div>
                      )}
                      <h3 style={{
                        margin: 0,
                        color: proj.ProjectColor || 'var(--brand-color)',
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.25rem',
                        background: 'none',
                        textAlign: 'center',
                        flex: 1,
                        lineHeight: '1.3',
                        // Use text-stroke for sharp outline instead of blurry shadow
                        WebkitTextStroke: isDarkMode && proj.ProjectColor
                          ? '0.5px rgba(255, 255, 240, 0.5)'
                          : 'none',
                        textStroke: isDarkMode && proj.ProjectColor
                          ? '0.5px rgba(255, 255, 240, 0.5)'
                          : 'none',
                        // Lighten the color in dark mode for better contrast
                        filter: isDarkMode && proj.ProjectColor
                          ? 'brightness(1.3) saturate(1.1)'
                          : 'none',
                      }}>
                        {proj.ProjectTitle}
                      </h3>
                      {/* Spacer to balance the logo on the left */}
                      {hasLogo && (
                        <div style={{ width: '56px', marginLeft: 'var(--space-sm)', flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ 
                      color: 'var(--dark-color)',
                      marginTop: 'var(--space-sm)',
                      marginBottom: 'var(--space-xs)',
                      lineHeight: '1.4',
                      fontSize: '0.95rem',
                    }}>
                      {proj.ProjectTagline || proj.ProjectDescription || ''}
                    </div>
                    <div style={{
                      marginBottom: 'var(--space-sm)',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      ...(proj.ProjectColor ? {
                        color: 'var(--dark-color)',
                        backgroundColor: (() => {
                          const hex = proj.ProjectColor.replace('#', '');
                          const r = parseInt(hex.substr(0, 2), 16);
                          const g = parseInt(hex.substr(2, 2), 16);
                          const b = parseInt(hex.substr(4, 2), 16);
                          return `rgba(${r}, ${g}, ${b}, ${isDarkMode ? 0.4 : 0.2})`;
                        })(),
                        padding: '3px 10px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        border: `2.5px solid ${proj.ProjectColor}`,
                      } : {
                        color: proj.ProjectColor || '#684522',
                      }),
                    }}>
                      {proj.ProjectStatus}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: 'var(--space-sm)',
                      marginTop: 'var(--space-sm)'
                    }}>
                      <Button 
                        label="Go" 
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to project
                          console.log('Go to project:', proj.ProjectKey);
                        }}
                        style={{ 
                          flex: 1,
                          backgroundColor: proj.ProjectColor || 'var(--brand-color)',
                          borderColor: 'var(--dark-color)',
                          boxShadow: (() => {
                            if (!proj.ProjectColor) return undefined;
                            const hex = proj.ProjectColor.replace('#', '');
                            const r = parseInt(hex.substr(0, 2), 16);
                            const g = parseInt(hex.substr(2, 2), 16);
                            const b = parseInt(hex.substr(4, 2), 16);
                            return `0 0 6px rgba(${r}, ${g}, ${b}, 0.3), 0 0 3px rgba(${r}, ${g}, ${b}, 0.2)`;
                          })(),
                        }}
                      />
                      {isAdmin && (
                        <Button 
                          label="Edit" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(proj);
                            setEditModalOpen(true);
                          }}
                          style={{ 
                            flex: 1,
                            ...(proj.ProjectColor ? {
                              color: 'var(--dark-color)',
                              backgroundColor: (() => {
                                const hex = proj.ProjectColor.replace('#', '');
                                const r = parseInt(hex.substr(0, 2), 16);
                                const g = parseInt(hex.substr(2, 2), 16);
                                const b = parseInt(hex.substr(4, 2), 16);
                                return `rgba(${r}, ${g}, ${b}, ${isDarkMode ? 0.4 : 0.2})`;
                              })(),
                              borderColor: proj.ProjectColor,
                              borderWidth: '2.5px',
                            } : {
                              color: proj.ProjectColor || 'var(--brand-color)',
                              borderColor: proj.ProjectColor || 'var(--brand-color)',
                            }),
                            boxShadow: (() => {
                              if (!proj.ProjectColor) return undefined;
                              const hex = proj.ProjectColor.replace('#', '');
                              const r = parseInt(hex.substr(0, 2), 16);
                              const g = parseInt(hex.substr(2, 2), 16);
                              const b = parseInt(hex.substr(4, 2), 16);
                              return `0 0 4px rgba(${r}, ${g}, ${b}, 0.25), 0 0 2px rgba(${r}, ${g}, ${b}, 0.15)`;
                            })(),
                          }}
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
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
            {!loading && filtered.map((proj) => {
              const hasLogo = proj.ProjectLogoURL;
              // Helper to add opacity to hex color
              const addOpacity = (color: string, opacity: number) => {
                if (!color) return '';
                const hex = color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return `rgba(${r}, ${g}, ${b}, ${opacity})`;
              };
              return (
                <Card 
                  key={proj.ProjectKey} 
                  style={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    padding: 'var(--space-md)',
                    border: `2.5px solid ${proj.ProjectColor || 'var(--shared-border-color)'}`,
                    boxShadow: proj.ProjectColor 
                      ? `0 0 8px ${addOpacity(proj.ProjectColor, 0.25)}, 0 0 4px ${addOpacity(proj.ProjectColor, 0.15)}`
                      : 'none',
                  }}
                  onClick={() => {
                    console.log('Navigate to project:', proj.ProjectKey);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Custom header with logo and title */}
                  <div style={{
                    marginTop: 0,
                    marginBottom: 0,
                    borderBottom: `2.5px solid ${proj.ProjectColor || 'var(--shared-border-color)'}`,
                    paddingBottom: 'var(--space-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                  }}>
                    {hasLogo && (
                      <div style={{ 
                        width: '56px',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        borderRadius: 'var(--radius-master)',
                        background: 'var(--light-color)',
                        border: `2.5px solid ${proj.ProjectColor || 'var(--shared-border-color)'}`,
                        padding: '4px',
                        marginRight: 'var(--space-sm)',
                      }}>
                        <img 
                          src={proj.ProjectLogoURL} 
                          alt={proj.ProjectTitle}
                          style={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain' 
                          }} 
                        />
                      </div>
                    )}
                    <h3 style={{
                      margin: 0,
                      color: proj.ProjectColor || 'var(--brand-color)',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.25rem',
                      background: 'none',
                      textAlign: 'center',
                      flex: 1,
                      lineHeight: '1.3',
                      // Use text-stroke for sharp outline instead of blurry shadow
                      WebkitTextStroke: document.body.classList.contains('dark-mode') && proj.ProjectColor
                        ? '0.5px rgba(255, 255, 240, 0.5)'
                        : 'none',
                      textStroke: document.body.classList.contains('dark-mode') && proj.ProjectColor
                        ? '0.5px rgba(255, 255, 240, 0.5)'
                        : 'none',
                      // Lighten the color in dark mode for better contrast
                      filter: document.body.classList.contains('dark-mode') && proj.ProjectColor
                        ? 'brightness(1.3) saturate(1.1)'
                        : 'none',
                    }}>
                      {proj.ProjectTitle}
                    </h3>
                    {/* Spacer to balance the logo on the left */}
                    {hasLogo && (
                      <div style={{ width: '56px', marginLeft: 'var(--space-sm)', flexShrink: 0 }} />
                    )}
                  </div>
                  <div style={{ 
                    color: 'var(--dark-color)',
                    marginTop: 'var(--space-sm)',
                    marginBottom: 'var(--space-xs)',
                    lineHeight: '1.4',
                    fontSize: '0.95rem',
                  }}>
                    {proj.ProjectTagline || proj.ProjectDescription || ''}
                  </div>
                  <div style={{
                    marginBottom: 'var(--space-sm)',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    // In dark mode, use light text on colored background for better contrast
                    ...(document.body.classList.contains('dark-mode') && proj.ProjectColor ? {
                      color: 'var(--dark-color)',
                      backgroundColor: (() => {
                        const hex = proj.ProjectColor.replace('#', '');
                        const r = parseInt(hex.substr(0, 2), 16);
                        const g = parseInt(hex.substr(2, 2), 16);
                        const b = parseInt(hex.substr(4, 2), 16);
                        return `rgba(${r}, ${g}, ${b}, 0.4)`;
                      })(),
                      padding: '3px 10px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      border: `1px solid ${proj.ProjectColor}`,
                    } : {
                      color: proj.ProjectColor || '#684522',
                    }),
                  }}>
                    {proj.ProjectStatus}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: 'var(--space-sm)',
                    marginTop: 'var(--space-sm)'
                  }}>
                    <Button 
                      label="Go" 
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Go to project:', proj.ProjectKey);
                      }}
                      style={{ 
                        flex: 1,
                        backgroundColor: proj.ProjectColor || 'var(--brand-color)',
                        borderColor: 'var(--dark-color)',
                        boxShadow: (() => {
                          if (!proj.ProjectColor) return undefined;
                          const hex = proj.ProjectColor.replace('#', '');
                          const r = parseInt(hex.substr(0, 2), 16);
                          const g = parseInt(hex.substr(2, 2), 16);
                          const b = parseInt(hex.substr(4, 2), 16);
                          return `0 0 6px rgba(${r}, ${g}, ${b}, 0.3), 0 0 3px rgba(${r}, ${g}, ${b}, 0.2)`;
                        })(),
                      }}
                    />
                    {isAdmin && (
                      <Button 
                        label="Edit" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Edit project:', proj.ProjectKey);
                        }}
                          style={{ 
                            flex: 1,
                            color: proj.ProjectColor || 'var(--brand-color)',
                            borderColor: proj.ProjectColor || 'var(--brand-color)',
                            boxShadow: (() => {
                              if (!proj.ProjectColor) return undefined;
                              const hex = proj.ProjectColor.replace('#', '');
                              const r = parseInt(hex.substr(0, 2), 16);
                              const g = parseInt(hex.substr(2, 2), 16);
                              const b = parseInt(hex.substr(4, 2), 16);
                              return `0 0 4px rgba(${r}, ${g}, ${b}, 0.25), 0 0 2px rgba(${r}, ${g}, ${b}, 0.15)`;
                            })(),
                          }}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </GridLayout>
        </div>
      )}

      {/* Admin Modals */}
      {isAdmin && (
        <>
          <ProjectEditModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedProject(null);
            }}
            project={selectedProject}
            onSave={loadProjects}
          />
          <ProjectCreateModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSave={loadProjects}
          />
        </>
      )}
    </PageContainer>
  );
};

export default Projects;
