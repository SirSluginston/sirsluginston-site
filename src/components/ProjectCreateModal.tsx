import React, { useState } from 'react';
import { Modal, Tabs, Button, Input } from '@sirsluginston/shared-ui';
import { ProjectConfig, PageConfig } from '../types/dynamodb';
import { saveProjectConfig, savePageConfig } from '../services/adminService';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Callback to refresh project list
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [projectData, setProjectData] = useState<Partial<ProjectConfig>>({
    ProjectID: '',
    ProjectTitle: '',
    ProjectSlug: '',
    ProjectTagline: '',
    ProjectDescription: '',
    ProjectLogoURL: '',
    ProjectStatus: 'Coming Soon',
    ProjectColor: '#4B3A78',
    YearCreated: new Date().getFullYear(),
    Version: '1.0.0',
    ProjectOrder: 0,
    ProjectTags: [],
  });
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAddPage = () => {
    const newPage: PageConfig = {
      ProjectKey: projectData.ProjectKey || '',
      PageKey: `Page-${Date.now()}`,
      PageTitle: 'New Page',
      Route: '/new-page',
      Version: '1.0.0',
      HasShell: true,
      InNavbar: false,
    };
    setPages([...pages, newPage]);
    setActiveTab(pages.length + 1); // Switch to new page tab
  };

  const handlePageSave = async (page: PageConfig) => {
    if (!projectData.ProjectKey) {
      alert('Please set Project Key first');
      return;
    }
    try {
      setSaving(true);
      const pageWithProjectKey = {
        ...page,
        ProjectKey: projectData.ProjectKey,
      };
      await savePageConfig(pageWithProjectKey);
      // Update the page in local state
      setPages(pages.map(p => p.PageKey === page.PageKey ? pageWithProjectKey : p));
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save page. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!projectData.ProjectKey || !projectData.ProjectTitle || !projectData.ProjectColor) {
      alert('Please fill in required fields: Project Key, Title, and Color');
      return;
    }

    try {
      setSaving(true);
      const newProject: ProjectConfig = {
        ProjectKey: projectData.ProjectKey,
        PageKey: 'Config',
        ProjectID: projectData.ProjectID || '1',
        ProjectTitle: projectData.ProjectTitle,
        ProjectSlug: projectData.ProjectSlug || projectData.ProjectKey.toLowerCase(),
        ProjectTagline: projectData.ProjectTagline,
        ProjectDescription: projectData.ProjectDescription,
        ProjectLogoURL: projectData.ProjectLogoURL,
        ProjectStatus: projectData.ProjectStatus || 'Coming Soon',
        ProjectColor: projectData.ProjectColor,
        YearCreated: projectData.YearCreated || new Date().getFullYear(),
        Version: projectData.Version || '1.0.0',
        ProjectOrder: projectData.ProjectOrder,
        ProjectTags: projectData.ProjectTags,
        LastUpdated: new Date().toISOString(),
      } as ProjectConfig;

      // Save project config
      await saveProjectConfig(newProject);

      // Save all pages
      for (const page of pages) {
        const pageWithProjectKey = {
          ...page,
          ProjectKey: projectData.ProjectKey,
        };
        await savePageConfig(pageWithProjectKey);
      }

      onSave();
      onClose();
      // Reset form
      setProjectData({
        ProjectID: '',
        ProjectTitle: '',
        ProjectSlug: '',
        ProjectTagline: '',
        ProjectDescription: '',
        ProjectLogoURL: '',
        ProjectStatus: 'Coming Soon',
        ProjectColor: '#4B3A78',
        YearCreated: new Date().getFullYear(),
        Version: '1.0.0',
        ProjectOrder: 0,
        ProjectTags: [],
      });
      setPages([]);
      setActiveTab(0);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  // Build tabs: Project Config + one per page
  const tabs = [
    {
      label: 'Project Config',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Input
            label="Project Key *"
            value={projectData.ProjectKey || ''}
            onChange={(e) => setProjectData({ ...projectData, ProjectKey: e.target.value })}
            placeholder="e.g., HabiTasks"
          />
          <Input
            label="Project Title *"
            value={projectData.ProjectTitle || ''}
            onChange={(e) => setProjectData({ ...projectData, ProjectTitle: e.target.value })}
            placeholder="e.g., HabiTasks"
          />
          <Input
            label="Project ID"
            value={projectData.ProjectID || ''}
            onChange={(e) => setProjectData({ ...projectData, ProjectID: e.target.value })}
            placeholder="e.g., 1, 2, 0.5"
          />
          <Input
            label="Project Slug"
            value={projectData.ProjectSlug || ''}
            onChange={(e) => setProjectData({ ...projectData, ProjectSlug: e.target.value })}
            placeholder="Auto-generated from Project Key if empty"
          />
          <Input
            label="Project Tagline"
            value={projectData.ProjectTagline || ''}
            onChange={(e) => setProjectData({ ...projectData, ProjectTagline: e.target.value })}
          />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <span style={{ fontWeight: 'bold' }}>Project Description</span>
            <textarea
              value={projectData.ProjectDescription || ''}
              onChange={(e) => setProjectData({ ...projectData, ProjectDescription: e.target.value })}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: 'var(--space-sm)',
                borderRadius: 'var(--radius-master)',
                border: '2.5px solid var(--shared-border-color)',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </label>
          <Input
            label="Project Logo URL"
            value={projectData.ProjectLogoURL || ''}
            onChange={(e) => setProjectData({ ...projectData, ProjectLogoURL: e.target.value })}
            placeholder="/logo.jpg or https://..."
          />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <span style={{ fontWeight: 'bold' }}>Project Status</span>
            <select
              value={projectData.ProjectStatus || 'Coming Soon'}
              onChange={(e) => setProjectData({ ...projectData, ProjectStatus: e.target.value as any })}
              style={{
                padding: 'var(--space-sm)',
                borderRadius: 'var(--radius-master)',
                border: '2.5px solid var(--shared-border-color)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Coming Soon">Coming Soon</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
          <Input
            label="Project Color *"
            type="color"
            value={projectData.ProjectColor || '#4B3A78'}
            onChange={(e) => setProjectData({ ...projectData, ProjectColor: e.target.value })}
          />
          <Input
            label="Year Created"
            type="number"
            value={projectData.YearCreated || new Date().getFullYear()}
            onChange={(e) => setProjectData({ ...projectData, YearCreated: parseInt(e.target.value) })}
          />
          <Input
            label="Project Order"
            type="number"
            value={projectData.ProjectOrder || 0}
            onChange={(e) => setProjectData({ ...projectData, ProjectOrder: parseInt(e.target.value) })}
          />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <span style={{ fontWeight: 'bold' }}>Project Tags (comma-separated)</span>
            <Input
              value={projectData.ProjectTags?.join(', ') || ''}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                setProjectData({ ...projectData, ProjectTags: tags });
              }}
              placeholder="e.g., web, productivity, tool"
            />
          </label>
          <Button
            label={saving ? 'Creating...' : 'Create Project'}
            onClick={handleSave}
            variant="primary"
            disabled={saving}
          />
        </div>
      ),
    },
    ...pages.map((page, idx) => ({
      label: page.PageTitle || `Page ${idx + 1}`,
      content: <PageEditor key={page.PageKey} page={page} onSave={handlePageSave} showSaveButton={false} />,
    })),
  ];

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div style={{ minWidth: '600px', maxWidth: '800px' }}>
        <h2 style={{ marginTop: 0, marginBottom: 'var(--space-lg)', fontFamily: 'var(--font-serif)', color: 'var(--brand-color)' }}>
          Create New Project
        </h2>
        <Tabs tabs={tabs} activeIndex={activeTab} onTabClick={setActiveTab} />
        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Button label="Add Page" onClick={handleAddPage} variant="outline" />
          <Button label="Close" onClick={onClose} variant="outline" />
        </div>
      </div>
    </Modal>
  );
};

// Page Editor Component (reused from ProjectEditModal)
interface PageEditorProps {
  page: PageConfig;
  onSave: (page: PageConfig) => void;
  showSaveButton?: boolean;
}

const PageEditor: React.FC<PageEditorProps> = ({ page, onSave, showSaveButton = true }) => {
  const [pageData, setPageData] = useState<PageConfig>(page);

  React.useEffect(() => {
    setPageData(page);
  }, [page]);

  const handleSave = () => {
    onSave({
      ...pageData,
      LastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <Input
        label="Page Key"
        value={pageData.PageKey}
        onChange={(e) => setPageData({ ...pageData, PageKey: e.target.value })}
      />
      <Input
        label="Page Title"
        value={pageData.PageTitle}
        onChange={(e) => setPageData({ ...pageData, PageTitle: e.target.value })}
      />
      <Input
        label="Page Tagline"
        value={pageData.PageTagline || ''}
        onChange={(e) => setPageData({ ...pageData, PageTagline: e.target.value })}
      />
      <Input
        label="Route"
        value={pageData.Route}
        onChange={(e) => setPageData({ ...pageData, Route: e.target.value })}
        placeholder="/page-path"
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <input
          type="checkbox"
          checked={pageData.InNavbar !== false}
          onChange={(e) => setPageData({ ...pageData, InNavbar: e.target.checked })}
        />
        <span>Show in Navbar</span>
      </label>
      <Input
        label="Navbar Order"
        type="number"
        value={pageData.NavbarOrder || 0}
        onChange={(e) => setPageData({ ...pageData, NavbarOrder: parseInt(e.target.value) || undefined })}
      />
      <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        <span style={{ fontWeight: 'bold' }}>Content Layout (JSON)</span>
        <textarea
          value={JSON.stringify(pageData.ContentLayout || {}, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setPageData({ ...pageData, ContentLayout: parsed });
            } catch {
              // Invalid JSON, keep as is
            }
          }}
          style={{
            width: '100%',
            minHeight: '200px',
            padding: 'var(--space-sm)',
            borderRadius: 'var(--radius-master)',
            border: '2.5px solid var(--shared-border-color)',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
          }}
        />
      </label>
      {showSaveButton && (
        <Button label="Save Page" onClick={handleSave} variant="primary" />
      )}
    </div>
  );
};
