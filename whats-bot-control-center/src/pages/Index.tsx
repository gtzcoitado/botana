
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { Branches } from '../components/Branches';
import { Messages } from '../components/Messages';
import { BranchInfo } from '../components/BranchInfo';
import { Reports } from '../components/Reports';
import { Settings } from '../components/Settings';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedBranch, setSelectedBranch] = useState<{id: string, name: string} | null>(null);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'branches':
        return <Branches onManageInfo={(branchId, branchName) => {
          setSelectedBranch({id: branchId, name: branchName});
          setActiveSection('branch-info');
        }} />;
      case 'messages':
        return <Messages />;
      case 'branch-info':
        return selectedBranch ? (
          <BranchInfo 
            branchId={selectedBranch.id} 
            branchName={selectedBranch.name}
            onBack={() => setActiveSection('branches')}
          />
        ) : null;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout onNavigate={setActiveSection} activeSection={activeSection}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
