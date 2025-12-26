import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Header, Card, GridLayout, Button, Input, Toggle } from '@sirsluginston/shared-ui';
import { PageConfigContext } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { signUp, confirmSignUp } from '../services/authService';
import { getUserSettings, updateUserSettings, createUserRecord, UserSettings } from '../services/userService';

const Account: React.FC = () => {
  const { pageConfig } = React.useContext(PageConfigContext);
  const { user, signIn, signOut, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  // User settings state
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Form state for settings
  const [displayName, setDisplayName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'auto'>('auto');
  const [showEmailPublicly, setShowEmailPublicly] = useState(false);
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false);
  
  // Sign in state
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [needsDisplayName, setNeedsDisplayName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [error, setError] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  const pageTitle = pageConfig?.pageTitle || 'Account';
  const pageTagline = pageConfig?.pageTagline || 'Manage your account settings';

  // Load user settings when authenticated
  useEffect(() => {
    if (user && !loading) {
      loadUserSettings();
    }
  }, [user, loading]);

  const loadUserSettings = async () => {
    if (!user) return;
    
    setLoadingSettings(true);
    try {
      const settings = await getUserSettings();
      if (settings) {
        setUserSettings(settings);
        setDisplayName(settings.DisplayName);
        setEmailNotifications(settings.EmailNotifications);
        setMarketingEmails(settings.MarketingEmails);
        setProjectUpdates(settings.ProjectUpdates);
        setSystemNotifications(settings.SystemNotifications);
        setThemePreference(settings.ThemePreference);
        setShowEmailPublicly(settings.ShowEmailPublicly);
        setAnalyticsOptOut(settings.AnalyticsOptOut);
      } else {
        // User settings don't exist yet - might be a new user
        // Set defaults from Cognito
        setDisplayName(user.name || '');
      }
    } catch (error: any) {
      console.error('Failed to load user settings:', error);
      // Show error message if available
      if (error.message) {
        setError(`Failed to load settings: ${error.message}`);
      }
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSavingSettings(true);
    setError('');
    try {
      // If user settings don't exist yet, create them
      if (!userSettings) {
        const created = await createUserRecord({
          Email: user.email,
          RealName: user.name || user.email,
          DisplayName: displayName || user.name || user.email,
        });
        setUserSettings(created);
        // Then update with all the settings
        const updated = await updateUserSettings({
          DisplayName: displayName,
          EmailNotifications: emailNotifications,
          MarketingEmails: marketingEmails,
          ProjectUpdates: projectUpdates,
          SystemNotifications: systemNotifications,
          ThemePreference: themePreference,
          ShowEmailPublicly: showEmailPublicly,
          AnalyticsOptOut: analyticsOptOut,
        });
        setUserSettings(updated);
      } else {
        // Update existing settings
        const updated = await updateUserSettings({
          DisplayName: displayName,
          EmailNotifications: emailNotifications,
          MarketingEmails: marketingEmails,
          ProjectUpdates: projectUpdates,
          SystemNotifications: systemNotifications,
          ThemePreference: themePreference,
          ShowEmailPublicly: showEmailPublicly,
          AnalyticsOptOut: analyticsOptOut,
        });
        setUserSettings(updated);
      }
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingAuth(true);
    try {
      await signIn(email, password);
      // Don't redirect - stay on account page
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
      // After verification, sign in to get user data
      await signIn(email, password);
      // Then prompt for display name
      setNeedsVerification(false);
      setNeedsDisplayName(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSetDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) {
      setError('Display name is required');
      return;
    }
    
    setError('');
    setLoadingAuth(true);
    try {
      // Create user record in DynamoDB
      await createUserRecord({
        Email: email,
        RealName: name || email,
        DisplayName: displayNameInput.trim(),
      });
      
      // Refresh user data and load settings
      await refreshUser();
      await loadUserSettings();
      
      // Redirect to account page
      setNeedsDisplayName(false);
      navigate('/account');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
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
          {needsDisplayName ? (
            <>
              <h2 style={{ marginTop: 0 }}>Choose Your Display Name</h2>
              <p style={{ color: 'var(--dark-color)', marginBottom: 'var(--space-md)' }}>
                Your display name will be shown publicly (e.g., on leaderboards). You can change it later.
              </p>
              <form onSubmit={handleSetDisplayName}>
                <Input
                  label="Display Name"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="johndoe"
                  required
                />
                {error && (
                  <div style={{ color: 'crimson', marginTop: 'var(--space-sm)', fontSize: '0.9rem' }}>
                    {error}
                  </div>
                )}
                <Button 
                  label="Continue" 
                  variant="primary" 
                  type="submit"
                  disabled={loadingAuth}
                  style={{ marginTop: 'var(--space-md)', width: '100%' }}
                />
              </form>
            </>
          ) : needsVerification ? (
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
      
      {loadingSettings ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <p>Loading settings...</p>
        </div>
      ) : (
        <>
          {error && (
            <div style={{ 
              color: 'crimson', 
              padding: 'var(--space-md)', 
              marginBottom: 'var(--space-md)',
              backgroundColor: 'rgba(220, 20, 60, 0.1)',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          
          <GridLayout columns={2} gap="2rem" style={{ marginTop: 'var(--space-xl)' }}>
            {/* Profile Information */}
            <Card title="Profile Information">
              <Input label="Email" value={user?.email || ''} disabled />
              <Input 
                label="Real Name" 
                value={userSettings?.RealName || user?.name || ''} 
                disabled
                style={{ marginTop: 'var(--space-md)' }}
              />
              <Input 
                label="Display Name" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                style={{ marginTop: 'var(--space-md)' }}
              />
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
              <Button 
                label="Save Changes" 
                variant="primary" 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                style={{ marginTop: 'var(--space-md)' }} 
              />
            </Card>

            {/* Notification Settings */}
            <Card title="Notification Settings">
              <Toggle
                label="Email Notifications"
                isOn={emailNotifications}
                onToggle={() => setEmailNotifications(!emailNotifications)}
              />
              <Toggle
                label="Marketing Emails"
                isOn={marketingEmails}
                onToggle={() => setMarketingEmails(!marketingEmails)}
                style={{ marginTop: 'var(--space-md)' }}
              />
              <Toggle
                label="Project Updates"
                isOn={projectUpdates}
                onToggle={() => setProjectUpdates(!projectUpdates)}
                style={{ marginTop: 'var(--space-md)' }}
              />
              <Toggle
                label="System Notifications"
                isOn={systemNotifications}
                onToggle={() => setSystemNotifications(!systemNotifications)}
                style={{ marginTop: 'var(--space-md)' }}
              />
              <Button 
                label="Save Preferences" 
                variant="primary" 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                style={{ marginTop: 'var(--space-md)' }} 
              />
            </Card>

            {/* App Settings */}
            <Card title="App Settings">
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--space-xs)', 
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--dark-color)'
                }}>
                  Theme Preference
                </label>
                <select
                  value={themePreference}
                  onChange={(e) => setThemePreference(e.target.value as 'light' | 'dark' | 'auto')}
                  style={{
                    width: '100%',
                    padding: 'var(--space-sm)',
                    borderRadius: 'var(--radius-master)',
                    border: '1px solid var(--dark-color)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '1rem',
                    backgroundColor: 'var(--light-color)',
                    color: 'var(--dark-color)',
                  }}
                >
                  <option value="auto">Auto (System)</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <Toggle
                label="Show Email Publicly"
                isOn={showEmailPublicly}
                onToggle={() => setShowEmailPublicly(!showEmailPublicly)}
                style={{ marginTop: 'var(--space-md)' }}
              />
              <Toggle
                label="Opt Out of Analytics"
                isOn={analyticsOptOut}
                onToggle={() => setAnalyticsOptOut(!analyticsOptOut)}
                style={{ marginTop: 'var(--space-md)' }}
              />
              <Button 
                label="Save Preferences" 
                variant="primary" 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                style={{ marginTop: 'var(--space-md)' }} 
              />
            </Card>

            {/* Account Actions */}
            <Card title="Account Actions">
              <Button label="Change Password" variant="outline" style={{ marginBottom: 'var(--space-sm)', width: '100%' }} />
              <Button 
                label="Sign Out" 
                variant="outline" 
                onClick={handleSignOut}
                style={{ marginBottom: 'var(--space-sm)', width: '100%' }}
              />
              <Button 
                label="Delete Account" 
                variant="outline" 
                style={{ color: 'crimson', borderColor: 'crimson', width: '100%' }} 
              />
            </Card>
          </GridLayout>
        </>
      )}
    </PageContainer>
  );
};

export default Account;
