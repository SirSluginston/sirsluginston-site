import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Header, StatCard, GridLayout, Card, Button } from '@sirsluginston/shared-ui';
import { PageConfigContext } from '../components/Layout';
import { fetchAllProjectConfigs } from '../services/configService';
import { ProjectConfig } from '../types/dynamodb';

const Home: React.FC = () => {
  const { pageConfig } = React.useContext(PageConfigContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch projects for dynamic stats
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectConfigs = await fetchAllProjectConfigs();
        // Filter out brand config (SirSluginston) - only count actual projects
        const filtered = projectConfigs.filter(p => p.ProjectKey !== 'SirSluginston');
        setProjects(filtered);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  // Calculate dynamic stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.ProjectStatus === 'Active').length;
  const yearsInService = projects.length > 0 
    ? new Date().getFullYear() - Math.min(...projects.map(p => p.YearCreated || new Date().getFullYear()))
    : 0;
  
  // Home page uses hardcoded content (custom narrative, not server-driven)
  // We still pull pageTitle and pageTagline from DB for consistency
  const pageTitle = pageConfig?.pageTitle || 'Home';
  const pageTagline = pageConfig?.pageTagline || 'Welcome to the Home Page!';

  return (
    <PageContainer>
      <Header title={pageTitle} subtitle={pageTagline} />
      
      {/* Hero Section with Backstory */}
      <Card style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
        <h2 style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: '2rem', 
          color: 'var(--brand-color)',
          marginTop: 0,
          marginBottom: 'var(--space-md)'
        }}>
          Debonair Gastropod Genius
        </h2>
        <p style={{ 
          fontSize: '1.1rem', 
          lineHeight: '1.8', 
          color: 'var(--dark-color)',
          marginBottom: 'var(--space-md)',
          fontStyle: 'italic'
        }}>
          Our trail is your future.
        </p>
        <p style={{ 
          fontSize: '1rem', 
          lineHeight: '1.8', 
          color: 'var(--dark-color)',
          marginBottom: 'var(--space-md)'
        }}>
          Over a decade ago, SirSluginston wasn't a company—he was a gamertag. Born from a late-night burst of creativity 
          between two friends, the mustached, monocled, top-hat wearing slug quickly took on a life of his own. What started 
          as a playful username became something more: a way of thinking. <em>Move at your own pace, and always leave a distinct 
          trail everywhere you go.</em>
        </p>
        <p style={{ 
          fontSize: '1rem', 
          lineHeight: '1.8', 
          color: 'var(--dark-color)',
          marginBottom: 'var(--space-lg)'
        }}>
          Today, SirSluginston stands as a creative umbrella company—a place where bold ideas find their footing and grow 
          into something remarkable.
        </p>
        <Button
          label="Explore Our Projects"
          variant="primary"
          onClick={() => navigate('/projects')}
          style={{ marginTop: 'var(--space-sm)' }}
        />
      </Card>

      {/* Dynamic Stat Cards */}
      {!loading && (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <GridLayout columns={totalProjects > 0 ? 3 : 1} gap="1.5rem">
            {totalProjects > 0 && (
              <StatCard label="Total Projects" value={totalProjects.toString()} />
            )}
            {activeProjects > 0 && (
              <StatCard label="Active Projects" value={activeProjects.toString()} />
            )}
            {yearsInService > 0 && (
              <StatCard label="Years in Service" value={`${yearsInService}+`} />
            )}
            {totalProjects === 0 && (
              <StatCard label="Projects" value="Coming Soon" />
            )}
          </GridLayout>
        </div>
      )}
    </PageContainer>
  );
};

export default Home;
