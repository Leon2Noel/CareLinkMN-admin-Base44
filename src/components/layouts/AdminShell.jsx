import React from 'react';
import Layout from '@/layout';

// Admin shell wraps the existing admin layout
export default function AdminShell({ children, currentPageName }) {
  return <Layout currentPageName={currentPageName}>{children}</Layout>;
}