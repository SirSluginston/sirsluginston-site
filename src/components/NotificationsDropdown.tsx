import React, { useRef, useEffect } from 'react';
import { Card } from '@sirsluginston/shared-ui';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate position - fixed top right near notification icon
  const position = { top: 80, right: 20 };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        right: `${position.right}px`,
        zIndex: 1000,
        minWidth: '300px',
        maxWidth: '400px',
        maxHeight: '500px',
        overflowY: 'auto',
      }}
    >
      <Card title="Notifications" style={{ margin: 0 }}>
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--space-xl)', 
          color: 'var(--dark-color)',
          opacity: 0.7 
        }}>
          <p>No notifications yet</p>
          <p style={{ fontSize: '0.9rem', marginTop: 'var(--space-sm)' }}>
            You'll see updates here when they arrive
          </p>
        </div>
      </Card>
    </div>
  );
};

export default NotificationsDropdown;

