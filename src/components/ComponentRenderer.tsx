import React from 'react';
import { ComponentTreeNode } from '../types/dynamodb';
import {
  PageContainer,
  Header,
  GridLayout,
  Card,
  Sidebar,
  Button,
  Input,
  StatCard,
  Badge,
  Alert,
  Toggle,
} from '@sirsluginston/shared-ui';

// Component registry - maps type strings to React components
const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  PageContainer,
  Header,
  GridLayout,
  Card,
  Sidebar,
  Button,
  Input,
  StatCard,
  Badge,
  Alert,
  Toggle,
};

/**
 * Recursively render a component tree from ContentLayout JSON
 */
export const ComponentRenderer: React.FC<{ node: ComponentTreeNode }> = ({ node }) => {
  const { type, props = {}, children, content } = node;

  // Handle text nodes
  if (type === 'text' || type === 'string') {
    return <>{content || ''}</>;
  }

  // Get component from registry
  const Component = COMPONENT_REGISTRY[type];

  if (!Component) {
    console.warn(`Unknown component type: ${type}`);
    return <div style={{ color: 'red' }}>Unknown component: {type}</div>;
  }

  // Map props for components that need different prop names
  let mappedProps = { ...props };
  if (type === 'StatCard' && props.title && !props.label) {
    // StatCard uses 'label' not 'title'
    mappedProps = { ...props, label: props.title };
    delete mappedProps.title;
  }

  // Handle HTML content for Card components
  if (type === 'Card' && content && typeof content === 'string' && content.includes('<')) {
    mappedProps.renderHTML = true;
    mappedProps.children = content;
  }

  // Render component with props and children
  return (
    <Component {...mappedProps}>
      {!mappedProps.renderHTML && children?.map((child, index) => (
        <ComponentRenderer key={index} node={child} />
      ))}
      {!mappedProps.renderHTML && content && typeof content !== 'string' && <>{content}</>}
    </Component>
  );
};

/**
 * Render a full content layout tree
 */
export const renderContentLayout = (layout: ComponentTreeNode | undefined): React.ReactNode => {
  if (!layout) {
    return null;
  }

  return <ComponentRenderer node={layout} />;
};

