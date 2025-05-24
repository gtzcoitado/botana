
import React from 'react';
import { X, BarChart3, Building2, MessageSquare, Settings, FileText, PieChart } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  activeSection: string;
}

const menuItems = [
  { icon: BarChart3, label: 'Dashboard', id: 'dashboard' },
  { icon: Building2, label: 'Filiais', id: 'branches' },
  { icon: MessageSquare, label: 'Central de Mensagens', id: 'messages' },
  { icon: PieChart, label: 'Relatórios', id: 'reports' },
  { icon: Settings, label: 'Configurações', id: 'settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, activeSection }) => {
  const handleNavigation = (sectionId: string) => {
    onNavigate(sectionId);
    onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                WhatsBot
              </span>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 mt-8 px-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <Button
                    variant={activeSection === item.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      activeSection === item.id && "bg-green-500 hover:bg-green-600 text-white"
                    )}
                    onClick={() => handleNavigation(item.id)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};
