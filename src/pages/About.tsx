import React from 'react';
import { PageContainer, Header, Card, GridLayout } from '@sirsluginston/shared-ui';
import { PageConfigContext } from '../components/Layout';
import { renderContentLayout } from '../components/ComponentRenderer';

const people = [
  { name: 'Logan Nizinski', role: 'Founder', desc: 'Slug enthusiast and creator of SirSluginston Co.' },
  { name: 'Dr. Mollusk', role: 'Co-Creator', desc: 'The friend who helped birth the SirSluginston gamertag and created the original SirSluginston artwork.' }
];

const About: React.FC = () => {
  const { pageConfig } = React.useContext(PageConfigContext);
  
  // About page uses hardcoded content (custom narrative, not server-driven)
  // We still pull pageTitle and pageTagline from DB for consistency
  const pageTitle = pageConfig?.pageTitle || 'About';
  const pageTagline = pageConfig?.pageTagline || 'Our Story';

  return (
    <PageContainer>
      <Header title={pageTitle} subtitle={pageTagline} />
      
      {/* Origin Story */}
      <Card title="The Origin Story" style={{ marginTop: 'var(--space-md)' }}>
        <p style={{ lineHeight: '1.8', marginBottom: 'var(--space-md)' }}>
          Over a decade ago, SirSluginston wasn't a company—he was a gamertag. Born from a late-night burst of creativity 
          between two friends, the mustached, monocled, top-hat wearing slug quickly took on a life of his own. What started 
          as a playful username became something more: a way of thinking. <em>Move at your own pace, and always leave a distinct 
          trail everywhere you go.</em>
        </p>
        <p style={{ lineHeight: '1.8', marginBottom: 'var(--space-md)' }}>
          As Logan's ambitions grew beyond gaming, SirSluginston evolved in parallel. The character that once represented 
          a gaming philosophy became the foundation for something bigger—a home where ideas can be nurtured independently, 
          until they're ready to flourish on their own.
        </p>
        <p style={{ lineHeight: '1.8' }}>
          Today, SirSluginston stands as a creative umbrella company—a place where bold ideas find their footing and grow 
          into something remarkable.
        </p>
      </Card>

      {/* Brand Tagline */}
      <Card style={{ marginTop: 'var(--space-md)', textAlign: 'center', background: 'var(--brand-color)', color: 'var(--light-color)', border: 'none' }}>
        <h2 style={{ 
          fontFamily: 'var(--font-serif)', 
          fontSize: '2rem', 
          margin: 0,
          color: 'var(--light-color)',
          fontStyle: 'italic'
        }}>
          Debonair Gastropod Genius
        </h2>
        <p style={{ 
          marginTop: 'var(--space-sm)', 
          fontSize: '1.1rem',
          opacity: 0.95,
          fontStyle: 'italic'
        }}>
          Our trail is your future.
        </p>
      </Card>

      {/* Our Mission */}
      <Card title="Our Mission" style={{ marginTop: 'var(--space-md)' }}>
        <p style={{ lineHeight: '1.8', marginBottom: 'var(--space-md)' }}>
          At SirSluginston Co., we believe in moving at your own pace—not because we're slow, but because we know that 
          the best ideas need time to develop. We're not here to rush to market; we're here to build things that matter. 
          Our philosophy is simple:
        </p>
        <ul style={{ lineHeight: '1.8', paddingLeft: 'var(--space-lg)' }}>
          <li><strong>Move deliberately:</strong> Every project gets the time and attention it deserves.</li>
          <li><strong>Leave a trail:</strong> We build with purpose, creating solutions that make a lasting impact.</li>
          <li><strong>Nurture independence:</strong> Each project under the SirSluginston umbrella grows on its own terms.</li>
          <li><strong>Innovate thoughtfully:</strong> Quality and creativity over speed and shortcuts.</li>
        </ul>
      </Card>

      {/* The Team */}
      <Card title="Meet the Team" style={{ marginTop: 'var(--space-md)' }}>
        <GridLayout columns={2} gap="1.5rem" style={{ marginTop: 'var(--space-md)' }}>
          {people.map((person, idx) => (
            <Card key={idx} title={person.name} style={{ margin: 0 }}>
              <div style={{ fontWeight: 'bold', color: 'var(--brand-color)', marginBottom: 'var(--space-xs)' }}>
                {person.role}
              </div>
              <div style={{ color: 'var(--dark-color)' }}>{person.desc}</div>
            </Card>
          ))}
        </GridLayout>
      </Card>

      {/* Goals & Vision */}
      <Card title="Our Vision" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <p style={{ lineHeight: '1.8', marginBottom: 'var(--space-md)' }}>
          We're building a portfolio of projects that work together as a cohesive ecosystem—a "Venture OS" that supports 
          everything from personal productivity to enterprise solutions. Each project under the SirSluginston umbrella 
          operates independently, yet they all share the same foundational philosophy: thoughtful design, reliable 
          functionality, and a commitment to excellence.
        </p>
        <p style={{ lineHeight: '1.8' }}>
          Like the slug that leaves a trail but never looks back, we focus on moving forward—building tools, platforms, 
          and experiences that make a real difference. We're not just building software; we're crafting the foundation 
          for what comes next.
        </p>
      </Card>
    </PageContainer>
  );
};

export default About;
