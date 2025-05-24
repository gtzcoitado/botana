
import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe, Palette, Users, Webhook, Bell, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    language: 'pt-BR',
    darkMode: false,
    notifications: true,
    webhookUrl: '',
    emailIntegration: false,
    telegramIntegration: false,
    databaseConnection: '',
    autoResponse: true,
    welcomeDelay: 2000,
  });

  const [users, setUsers] = useState([
    { id: '1', name: 'Admin Principal', email: 'admin@empresa.com', role: 'admin', active: true },
    { id: '2', name: 'João Silva', email: 'joao@empresa.com', role: 'operator', active: true },
    { id: '3', name: 'Maria Santos', email: 'maria@empresa.com', role: 'viewer', active: false },
  ]);

  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'viewer' });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      setUsers([...users, {
        id: Date.now().toString(),
        ...newUser,
        active: true
      }]);
      setNewUser({ name: '', email: '', role: 'viewer' });
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, active: !user.active } : user
    ));
  };

  const removeUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      'admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'operator': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'viewer': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    
    const roleNames = {
      'admin': 'Administrador',
      'operator': 'Operador',
      'viewer': 'Visualizador'
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors]}>
        {roleNames[role as keyof typeof roleNames]}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white px-2 md:px-0">
        Configurações Gerais
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* General Settings */}
        <Card className="mx-2 md:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center text-base md:text-lg">
              <SettingsIcon className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Configurações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm">Idioma do Bot</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex-1 pr-4">
                <Label className="text-sm">Respostas Automáticas</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Ativar respostas automáticas do bot
                </p>
              </div>
              <Switch
                checked={settings.autoResponse}
                onCheckedChange={(checked) => handleSettingChange('autoResponse', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcomeDelay" className="text-sm">Delay da Mensagem de Boas-vindas (ms)</Label>
              <Input
                id="welcomeDelay"
                type="number"
                value={settings.welcomeDelay}
                onChange={(e) => handleSettingChange('welcomeDelay', parseInt(e.target.value))}
                placeholder="2000"
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="mx-2 md:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center text-base md:text-lg">
              <Palette className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 pr-4">
                <Label className="text-sm">Tema Escuro</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Ativar modo escuro do painel
                </p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex-1 pr-4">
                <Label className="text-sm">Notificações</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Receber notificações do sistema
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="mx-2 md:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center text-base md:text-lg">
              <Database className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Integrações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 pr-4">
                <Label className="text-sm">Integração com E-mail</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Enviar relatórios por e-mail
                </p>
              </div>
              <Switch
                checked={settings.emailIntegration}
                onCheckedChange={(checked) => handleSettingChange('emailIntegration', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex-1 pr-4">
                <Label className="text-sm">Integração com Telegram</Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Sincronizar com bot do Telegram
                </p>
              </div>
              <Switch
                checked={settings.telegramIntegration}
                onCheckedChange={(checked) => handleSettingChange('telegramIntegration', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="database" className="text-sm">String de Conexão do Banco</Label>
              <Input
                id="database"
                value={settings.databaseConnection}
                onChange={(e) => handleSettingChange('databaseConnection', e.target.value)}
                placeholder="mongodb://localhost:27017/botdb"
                type="password"
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Webhook Settings */}
        <Card className="mx-2 md:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center text-base md:text-lg">
              <Webhook className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Webhook & API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook" className="text-sm">URL do Webhook</Label>
              <Input
                id="webhook"
                value={settings.webhookUrl}
                onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
                placeholder="https://sua-api.com/webhook"
                className="text-sm"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                URL para receber notificações de eventos do bot
              </p>
            </div>

            <Button variant="outline" className="w-full text-sm">
              Testar Webhook
            </Button>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-2 text-sm">Eventos Disponíveis:</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• message.received</li>
                <li>• message.sent</li>
                <li>• bot.connected</li>
                <li>• bot.disconnected</li>
                <li>• error.occurred</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card className="mx-2 md:mx-0">
        <CardHeader>
          <CardTitle className="flex items-center text-base md:text-lg">
            <Users className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            Gerenciamento de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add New User */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Input
              placeholder="Nome completo"
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              className="text-sm"
            />
            <Input
              placeholder="E-mail"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              className="text-sm"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="p-2 text-sm border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="viewer">Visualizador</option>
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
            <Button onClick={handleAddUser} className="bg-green-500 hover:bg-green-600 text-sm">
              Adicionar
            </Button>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{user.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{user.email}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getRoleBadge(user.role)}
                    <Badge variant={user.active ? "default" : "secondary"} className="text-xs">
                      {user.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 sm:hidden">
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <Switch
                      checked={user.active}
                      onCheckedChange={() => toggleUserStatus(user.id)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeUser(user.id)}
                    className="text-red-600 hover:text-red-700 text-xs"
                    disabled={user.role === 'admin'}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end px-2 md:px-0">
        <Button size="lg" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};
