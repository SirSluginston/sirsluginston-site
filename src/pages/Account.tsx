import React, { useState } from 'react';
import { PageContainer, Header, Card, GridLayout, Button, Input, Toggle } from '@sirsluginston/shared-ui';
import { PageConfigContext } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { signUp, confirmSignUp } from '../services/authService';

const Account: React.FC = () => {
  const { pageConfig } = React.useContext(PageConfigContext);
  const { user, signIn, signOut, loading } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Sign in state
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [error, setError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  const pageTitle = pageConfig?.pageTitle || 'Account';
  const pageTagline = pageConfig?.pageTagline || 'Manage your account settings';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingAuth(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingAuth(true);
    try {
      await signUp(email, password, name || undefined);
      setNeedsVerification(true);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingAuth(true);
    try {
      await confirmSignUp(email, verificationCode);
      setNeedsVerification(false);
      setIsSignIn(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Show sign in/sign up if not authenticated
  if (!user && !loading) {
    return (
      <PageContainer>
        <Header title={pageTitle} subtitle={pageTagline} />
        
        <Card style={{ maxWidth: '500px', margin: 'var(--space-xl) auto' }}>
          {needsVerification ? (
            <>
              <h2 style={{ marginTop: 0 }}>Verify Your Email</h2>
              <p style={{ color: 'var(--dark-color)', marginBottom: 'var(--space-md)' }}>
                We sent a verification code to {email}. Please enter it below.
              </p>
              <form onSubmit={handleConfirmSignUp}>
                <Input
                  label="Verification Code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter code"
                  required
                />
                {error && (
                  <div style={{ color: 'crimson', marginTop: 'var(--space-sm)', fontSize: '0.9rem' }}>
                    {error}
                  </div>
                )}
                <Button 
                  label="Verify" 
                  variant="primary" 
                  type="submit"
                  disabled={loadingAuth}
                  style={{ marginTop: 'var(--space-md)', width: '100%' }}
                />
                <Button 
                  label="Back" 
                  variant="outline" 
                  onClick={() => {
                    setNeedsVerification(false);
                    setError('');
                  }}
                  style={{ marginTop: 'var(--space-sm)', width: '100%' }}
                />
              </form>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <Button
                  label="Sign In"
                  variant={isSignIn ? 'primary' : 'outline'}
                  onClick={() => {
                    setIsSignIn(true);
                    setError('');
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Sign Up"
                  variant={!isSignIn ? 'primary' : 'outline'}
                  onClick={() => {
                    setIsSignIn(false);
                    setError('');
                  }}
                  style={{ flex: 1 }}
                />
              </div>

              <form onSubmit={isSignIn ? handleSignIn : handleSignUp}>
                {!isSignIn && (
                  <Input
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    style={{ marginBottom: 'var(--space-md)' }}
                  />
                )}
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{ marginBottom: 'var(--space-md)' }}
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ marginBottom: 'var(--space-md)' }}
                />
                {error && (
                  <div style={{ color: 'crimson', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
                    {error}
                  </div>
                )}
                <Button 
                  label={isSignIn ? 'Sign In' : 'Sign Up'} 
                  variant="primary" 
                  type="submit"
                  disabled={loadingAuth}
                  style={{ width: '100%' }}
                />
              </form>
            </>
          )}
        </Card>
      </PageContainer>
    );
  }

  // Show account settings if authenticated
  return (
    <PageContainer>
      <Header title={pageTitle} subtitle={pageTagline} />
      
      <GridLayout columns={2} gap="2rem" style={{ marginTop: 'var(--space-xl)' }}>
        {/* Profile Information */}
        <Card title="Profile Information">
          <Input label="Email" value={user?.email || ''} disabled />
          <Input label="Display Name" value={user?.name || ''} placeholder="Your Name" />
          {user?.isAdmin && (
            <div style={{ 
              marginTop: 'var(--space-sm)', 
              padding: 'var(--space-sm)', 
              backgroundColor: 'var(--accent-color)', 
              borderRadius: '4px',
              fontSize: '0.9rem',
              color: 'var(--dark-color)'
            }}>
              Admin User
            </div>
          )}
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
          <Button 
            label="Sign Out" 
            variant="outline" 
            onClick={handleSignOut}
            style={{ marginBottom: 'var(--space-sm)' }}
          />
          <Button label="Delete Account" variant="outline" style={{ color: 'crimson', borderColor: 'crimson' }} />
        </Card>
      </GridLayout>
    </PageContainer>
  );
};

export default Account;
