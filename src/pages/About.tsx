import React from 'react';
import { PageContainer, Header, Card, GridLayout } from '@sirsluginston/shared-ui';
import { PageConfigContext } from '../components/Layout';
import { renderContentLayout } from '../components/ComponentRenderer';

const people = [
  { name: 'Logan Nizinski', role: 'Founder', desc: 'Slug enthusiast and creator of SirSluginston Co.' },
  { name: 'Dr. Mollusk', role: 'Advisor', desc: 'Expert gastropod wrangler and lifecycle specialist.' }
];

const About: React.FC = () => {
  const { pageConfig } = React.useContext(PageConfigContext);
  
  // If ContentLayout exists in DB, use it (fully server-driven)
  if (pageConfig?.contentLayout) {
    return <>{renderContentLayout(pageConfig.contentLayout)}</>;
  }
  
  // Fallback to hardcoded content (backwards compatibility)
  const pageTitle = pageConfig?.pageTitle || 'About';
  const pageTagline = pageConfig?.pageTagline || 'Our Story';

  return (
    <PageContainer>
      <Header title={pageTitle} subtitle={pageTagline} />
      <GridLayout columns={2} gap="2rem">
        {people.map((person, idx) => (
          <Card key={idx} title={person.name}>
            <div><strong>{person.role}</strong></div>
            <div>{person.desc}</div>
          </Card>
        ))}
      </GridLayout>
      <p style={{marginTop: 40}}>This company is all about the slug life. Fun fact: Slugs are awesome.</p>
    </PageContainer>
  );
};

export default About;
