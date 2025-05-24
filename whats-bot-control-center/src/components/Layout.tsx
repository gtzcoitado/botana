
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (section: string) => void;
  activeSection: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate, activeSection }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onNavigate={onNavigate}
        activeSection={activeSection}
      />
      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="pt-4 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
