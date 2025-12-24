import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, Input, Card } from '@sirsluginston/shared-ui';
import { ProjectConfig, PageConfig } from '../types/dynamodb';
import { saveProjectConfig, savePageConfig, deletePageConfig } from '../services/adminService';
import { fetchProjectPages } from '../services/configService';

interface ProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectConfig | null;
  onSave: () => void; // Callback to refresh project list
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [projectData, setProjectData] = useState<Partial<ProjectConfig>>({});
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load project data and pages when modal opens
  useEffect(() => {
    if (isOpen && project) {
      setProjectData(project);
      loadPages();
    }
  }, [isOpen, project]);

  const loadPages = async () => {
    if (!project) return;
    try {
      setLoading(true);
      const fetchedPages = await fetchProjectPages(project.ProjectKey);
      setPages(fetchedPages);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSave = async () => {
    if (!project) return;
    try {
      setSaving(true);
      const fullProjectConfig: ProjectConfig = {
        ...project,
        ...projectData,
        ProjectKey: project.ProjectKey,
        PageKey: 'Config',
        LastUpdated: new Date().toISOString(),
      } as ProjectConfig;
      await saveProjectConfig(fullProjectConfig);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handlePageSave = async (page: PageConfig) => {
    if (!project) return;
    try {
      setSaving(true);
      await savePageConfig(page);
      await loadPages(); // Reload pages
      onSave();
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save page. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handlePageDelete = async (pageKey: string) => {
    if (!project) return;
    if (!confirm(`Are you sure you want to delete page "${pageKey}"?`)) return;
    try {
      setSaving(true);
      await deletePageConfig(project.ProjectKey, pageKey);
      await loadPages(); // Reload pages
      onSave();
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPage = () => {
    if (!project) return;
    const newPage: PageConfig = {
      ProjectKey: project.ProjectKey,
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

  if (!project) return null;

  // Build tabs: Project Config + one per page
  const tabs = [
    {
      label: 'Project Config',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Input
            label="Project Title"
            value={projectData.ProjectTitle || ''}
            onChange={(e) => setProjectData({ ...projectData, ProjectTitle: e.target.value })}
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
              value={projectData.ProjectStatus || 'Active'}
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
            label="Project Color"
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
            label={saving ? 'Saving...' : 'Save Project Config'}
            onClick={handleProjectSave}
            variant="primary"
            disabled={saving}
          />
        </div>
      ),
    },
    ...pages.map((page, idx) => ({
      label: page.PageTitle || `Page ${idx + 1}`,
      content: <PageEditor key={page.PageKey} page={page} onSave={handlePageSave} onDelete={handlePageDelete} />,
    })),
  ];

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div style={{ minWidth: '600px', maxWidth: '800px' }}>
        <h2 style={{ marginTop: 0, marginBottom: 'var(--space-lg)', fontFamily: 'var(--font-serif)', color: 'var(--brand-color)' }}>
          Edit Project: {project.ProjectTitle}
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

// Page Editor Component
interface PageEditorProps {
  page: PageConfig;
  onSave: (page: PageConfig) => void;
  onDelete: (pageKey: string) => void;
}

const PageEditor: React.FC<PageEditorProps> = ({ page, onSave, onDelete }) => {
  const [pageData, setPageData] = useState<PageConfig>(page);

  useEffect(() => {
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
      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <Button label="Save Page" onClick={handleSave} variant="primary" />
        <Button label="Delete Page" onClick={() => onDelete(page.PageKey)} variant="outline" />
      </div>
    </div>
  );
};

