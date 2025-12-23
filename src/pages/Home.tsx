import React from 'react';
import { PageContainer, Header, StatCard, GridLayout } from '@sirsluginston/shared-ui';
import { PageConfigContext } from '../components/Layout';
import { renderContentLayout } from '../components/ComponentRenderer';

const stats = [
  { label: 'Projects', value: '4' },
  { label: 'Active Users', value: '312' },
  { label: 'Slugs Served', value: '2,791' },
  { label: 'Years in Service', value: '5+' },
];

const Home: React.FC = () => {
  const { pageConfig } = React.useContext(PageConfigContext);
  
  // If ContentLayout exists in DB, use it (fully server-driven)
  if (pageConfig?.contentLayout) {
    return <>{renderContentLayout(pageConfig.contentLayout)}</>;
  }
  
  // Fallback to hardcoded content (backwards compatibility)
  const pageTitle = pageConfig?.pageTitle || 'Home';
  const pageTagline = pageConfig?.pageTagline || 'Welcome to the Home Page!';

  return (
    <PageContainer>
      <Header title={pageTitle} subtitle={pageTagline} />
      
      {/* Hero Content */}
      <div style={{ 
        marginTop: 'var(--space-xl)', 
        marginBottom: 'var(--space-xl)',
        textAlign: 'center',
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '0 var(--space-lg)'
      }}>
        <h2 style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: '2rem', 
          color: 'var(--brand-color)',
          marginBottom: 'var(--space-md)'
        }}>
          Welcome to SirSluginston Co.
        </h2>
        <p style={{ 
          fontSize: '1.1rem', 
          lineHeight: '1.6', 
          color: 'var(--dark-color)',
          marginBottom: 'var(--space-lg)'
        }}>
          Building innovative solutions for the modern world. Explore our projects, 
          learn about our mission, and join us on our journey.
        </p>
      </div>

      {/* Stat Cards at Bottom */}
      <div style={{ marginTop: 'var(--space-xxl)', marginBottom: 'var(--space-xl)' }}>
        <GridLayout columns={4} gap="1.5rem">
          {stats.map((s, idx) => (
            <StatCard key={idx} label={s.label} value={s.value} />
          ))}
        </GridLayout>
      </div>
    </PageContainer>
  );
};

export default Home;
