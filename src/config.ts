// Legacy config exports for backwards compatibility
// New code should use configService.ts instead

import { fetchBrandConfig, fetchProjectConfig } from './services/configService';

// Re-export for backwards compatibility (will be deprecated)
export const brandConfig = {
  logoUrl: '/logo.jpg',
  title: 'SirSluginston Co.',
  color: '#D2691E',
  yearCreated: 2020,
  navLinks: [
    { label: 'Home', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'About', path: '/about' },
    { label: 'Admin', path: '/admin', adminOnly: true },
  ],
  footerLinks: [
    { label: 'Support', url: 'mailto:support@sirsluginston.com' },
    { label: 'GitHub', url: 'https://github.com/sirsluginston' }
  ]
};

export const projectStatusOptions = ['Active', 'Maintenance', 'Coming Soon', 'Archived'];

export const projects = [
  { id: 1, title: 'Slug-OS', status: 'Active', description: 'An operating system for ultimate slug productivity.' },
  { id: 2, title: 'Slug News', status: 'Maintenance', description: 'Stay up to date with the latest slug world news.' },
  { id: 3, title: 'SlugPay', status: 'Active', description: 'Secure transactions for slimy commerce.' },
  { id: 4, title: 'Slug Social', status: 'Coming Soon', description: 'The next big thing in gastropod networking!' },
];

