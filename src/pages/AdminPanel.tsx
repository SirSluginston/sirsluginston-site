import React, { useState } from 'react';
import { PageContainer, Header, Card, Button, Input } from '@sirsluginston/shared-ui';
import { PageConfigContext } from '../components/Layout';
import { renderContentLayout } from '../components/ComponentRenderer';

// Note: There is no TextArea component from SharedUI. We'll use a native textarea.

const AdminPanel: React.FC = () => {
  const { pageConfig } = React.useContext(PageConfigContext);
  
  // If ContentLayout exists in DB, use it (fully server-driven)
  if (pageConfig?.contentLayout) {
    return <>{renderContentLayout(pageConfig.contentLayout)}</>;
  }
  
  // Fallback to hardcoded content (backwards compatibility)
  const pageTitle = pageConfig?.pageTitle || 'Admin Console';
  const pageTagline = pageConfig?.pageTagline || 'Manage SirSluginston Co. Projects';
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    brandColor: '#D2691E',
    githubLink: '',
  });

  const handleSave = () => {
    // This is where you'll eventually "Push to DynamoDB"
    console.log('Saving to SirSluginston Database:', projectData);
    alert('Project Data Generated! Check console for JSON.');
  };

  return (
    <PageContainer>
      <Header title={pageTitle} subtitle={pageTagline} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%' }}>
        {/* Left Side: The Editor */}
        <Card title="Project Editor">
          <Input
            label="Project Name"
            placeholder="e.g. Slug-OS"
            value={projectData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setProjectData({ ...projectData, name: e.target.value })
            }
          />
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Description
            <textarea
              placeholder="What is this project about?"
              value={projectData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setProjectData({ ...projectData, description: e.target.value })
              }
              style={{ width: '100%', minHeight: '80px', marginTop: '0.25rem', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </label>
          <Input
            label="Brand Color"
            type="color"
            value={projectData.brandColor}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setProjectData({ ...projectData, brandColor: e.target.value })
            }
          />
          <Button label="Save to DynamoDB" onClick={handleSave} />
        </Card>
        {/* Right Side: The Preview (Server Driven UI Simulation) */}
        <Card title="Live Preview">
          <div
            style={{
              padding: '1rem',
              border: `2px solid ${projectData.brandColor}`,
              borderRadius: 'var(--radius-master)',
            }}
          >
            <h2 style={{ color: projectData.brandColor }}>
              {projectData.name || 'Project Title'}
            </h2>
            <p>{projectData.description || 'Project description will appear here...'}</p>
          </div>
          <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: '#666' }}>
            Note: This preview uses your SharedUI variables.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AdminPanel;

