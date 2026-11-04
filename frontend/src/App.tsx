import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { SearchPage } from './pages/SearchPage.js';
import { LeadsPage } from './pages/LeadsPage.js';
import { SavedLeadsPage } from './pages/SavedLeadsPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { DataSourcesPage } from './pages/DataSourcesPage.js';
import { ApiSettingsPage } from './pages/ApiSettingsPage.js';
import { UsageCostsPage } from './pages/UsageCostsPage.js';
import { AccountPage } from './pages/AccountPage.js';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="saved" element={<SavedLeadsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="sources" element={<DataSourcesPage />} />
        <Route path="settings/api" element={<ApiSettingsPage />} />
        <Route path="usage" element={<UsageCostsPage />} />
        <Route path="settings/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
