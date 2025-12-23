import React from 'react';
import { PageContainer, Header, Card, GridLayout, Button, Input, Toggle } from '@sirsluginston/shared-ui';
import { PageConfigContext } from '../components/Layout';

const Account: React.FC = () => {
  const { pageConfig } = React.useContext(PageConfigContext);
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [marketingEmails, setMarketingEmails] = React.useState(false);

  const pageTitle = pageConfig?.pageTitle || 'Account';
  const pageTagline = pageConfig?.pageTagline || 'Manage your account settings';

  return (
    <PageContainer>
      <Header title={pageTitle} subtitle={pageTagline} />
      
      <GridLayout columns={2} gap="2rem" style={{ marginTop: 'var(--space-xl)' }}>
        {/* Profile Information */}
        <Card title="Profile Information">
          <Input label="Email" placeholder="user@example.com" defaultValue="user@example.com" />
          <Input label="Display Name" placeholder="Your Name" defaultValue="User" />
          <Button label="Save Changes" variant="primary" style={{ marginTop: 'var(--space-md)' }} />
        </Card>

        {/* Notification Settings */}
        <Card title="Notification Settings">
          <Toggle
            label="Email Notifications"
            isOn={emailNotifications}
            onToggle={setEmailNotifications}
          />
          <Toggle
            label="Marketing Emails"
            isOn={marketingEmails}
            onToggle={setMarketingEmails}
          />
          <Button label="Save Preferences" variant="primary" style={{ marginTop: 'var(--space-md)' }} />
        </Card>

        {/* App Settings */}
        <Card title="App Settings">
          <p style={{ color: 'var(--dark-color)', marginBottom: 'var(--space-md)' }}>
            Customize your experience
          </p>
          <Button label="Reset Preferences" variant="outline" />
        </Card>

        {/* Account Actions */}
        <Card title="Account Actions">
          <Button label="Change Password" variant="outline" style={{ marginBottom: 'var(--space-sm)' }} />
          <Button label="Delete Account" variant="outline" style={{ color: 'crimson', borderColor: 'crimson' }} />
        </Card>
      </GridLayout>
    </PageContainer>
  );
};

export default Account;

