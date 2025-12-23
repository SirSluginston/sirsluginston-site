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
      <GridLayout columns={2} gap="2rem">
        {stats.map((s, idx) => (
          <StatCard key={idx} title={s.label} value={s.value} />
        ))}
      </GridLayout>
      <p style={{marginTop: 40}}>Home page content goes here.</p>
    </PageContainer>
  );
};

export default Home;
