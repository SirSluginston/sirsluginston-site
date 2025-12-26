import React from 'react';
import { PageContainer, Header, Card, GridLayout } from '@sirsluginston/shared-ui';
import { PageConfigContext } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const Treasury: React.FC = () => {
  const { pageConfig } = React.useContext(PageConfigContext);
  const { isAdmin } = useAuth();
  
  // Treasury page uses hardcoded content
  const pageTitle = pageConfig?.pageTitle || 'Treasury';
  const pageTagline = pageConfig?.pageTagline || 'Company Treasury & Investments';

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <PageContainer>
        <Header title="Access Denied" subtitle="This page is only available to administrators." />
        <Card style={{ marginTop: 'var(--space-md)' }}>
          <p style={{ color: 'var(--dark-color)' }}>
            You do not have permission to view this page.
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header title={pageTitle} subtitle={pageTagline} />
      
      {/* Treasury Overview */}
      <Card title="Treasury Overview" style={{ marginTop: 'var(--space-md)' }}>
        <p style={{ color: 'var(--dark-color)', marginBottom: 'var(--space-md)' }}>
          Track and manage company treasury, including stocks, cryptocurrencies, and other investments.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-md)'
        }}>
          <div style={{
            padding: 'var(--space-md)',
            border: '2.5px solid var(--shared-border-color)',
            borderRadius: 'var(--radius-master)',
            background: 'var(--light-color)'
          }}>
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'var(--dark-color)', 
              opacity: 0.7,
              marginBottom: 'var(--space-xs)'
            }}>
              Total Treasury Value
            </div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: 'var(--brand-color)'
            }}>
              $0.00
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--dark-color)', 
              opacity: 0.6,
              marginTop: 'var(--space-xs)'
            }}>
              Integration pending
            </div>
          </div>
        </div>
      </Card>

      {/* Stocks Section */}
      <Card title="Stock Holdings" style={{ marginTop: 'var(--space-md)' }}>
        <p style={{ color: 'var(--dark-color)', marginBottom: 'var(--space-md)' }}>
          Track company stock investments and portfolio performance.
        </p>
        
        <div style={{ 
          padding: 'var(--space-md)', 
          border: '2.5px solid var(--shared-border-color)', 
          borderRadius: 'var(--radius-master)',
          background: 'var(--light-color)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--dark-color)', opacity: 0.7 }}>
            Stock tracking integration pending
          </p>
          <p style={{ 
            fontSize: '0.9rem', 
            color: 'var(--dark-color)', 
            opacity: 0.6,
            marginTop: 'var(--space-xs)'
          }}>
            Requires external API integration (e.g., Alpha Vantage, Yahoo Finance)
          </p>
        </div>
      </Card>

      {/* Cryptocurrency Section */}
      <Card title="Cryptocurrency Holdings" style={{ marginTop: 'var(--space-md)' }}>
        <p style={{ color: 'var(--dark-color)', marginBottom: 'var(--space-md)' }}>
          Monitor cryptocurrency investments and wallet balances.
        </p>
        
        <div style={{ 
          padding: 'var(--space-md)', 
          border: '2.5px solid var(--shared-border-color)', 
          borderRadius: 'var(--radius-master)',
          background: 'var(--light-color)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--dark-color)', opacity: 0.7 }}>
            Cryptocurrency tracking integration pending
          </p>
          <p style={{ 
            fontSize: '0.9rem', 
            color: 'var(--dark-color)', 
            opacity: 0.6,
            marginTop: 'var(--space-xs)'
          }}>
            Requires external API integration (e.g., CoinGecko, CoinMarketCap)
          </p>
        </div>
      </Card>

      {/* Implementation Note */}
      <Card style={{ 
        marginTop: 'var(--space-md)', 
        background: 'var(--accent-color)', 
        color: 'var(--light-color)',
        border: 'none'
      }}>
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: 'var(--space-sm)',
          color: 'var(--light-color)',
          fontFamily: 'var(--font-serif)'
        }}>
          Implementation Notes
        </h3>
        <p style={{ 
          color: 'var(--light-color)', 
          opacity: 0.95,
          lineHeight: '1.6',
          marginBottom: 0
        }}>
          <strong>Legal & Regulatory:</strong> Ensure compliance with financial regulations when displaying 
          treasury data. Consider consulting with legal counsel regarding disclosure requirements.
        </p>
        <p style={{ 
          color: 'var(--light-color)', 
          opacity: 0.95,
          lineHeight: '1.6',
          marginTop: 'var(--space-sm)',
          marginBottom: 0
        }}>
          <strong>Technical Requirements:</strong> This page will require integration with external APIs for 
          real-time price data, secure wallet connections, and potentially a backend service to aggregate 
          and cache data for performance.
        </p>
      </Card>
    </PageContainer>
  );
};

export default Treasury;

