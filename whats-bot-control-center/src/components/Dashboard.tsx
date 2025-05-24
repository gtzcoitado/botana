
import React, { useState } from 'react';
import { Play, Pause, Activity, MessageCircle, Building2, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export const Dashboard: React.FC = () => {
  const [botActive, setBotActive] = useState(true);
  const [botStatus, setBotStatus] = useState<'online' | 'offline' | 'connecting' | 'error'>('online');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Erro de Conexão';
      default: return 'Desconhecido';
    }
  };

  const recentMessages = [
    { time: '14:32', branch: 'Filial Centro', message: 'Mensagem de boas-vindas enviada para +55 11 99999-9999' },
    { time: '14:28', branch: 'Filial Norte', message: 'Resposta automática sobre horários de funcionamento' },
    { time: '14:25', branch: 'Filial Sul', message: 'Informações sobre produtos enviadas automaticamente' },
    { time: '14:20', branch: 'Filial Centro', message: 'Menu principal exibido para cliente' },
  ];

  return (
    <div className="space-y-6">
      {/* Bot Control Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Controle do Bot</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  size="lg"
                  onClick={() => setBotActive(!botActive)}
                  className={`${botActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                >
                  {botActive ? (
                    <>
                      <Pause className="mr-2 h-5 w-5" />
                      Desativar Bot
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Ativar Bot
                    </>
                  )}
                </Button>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(botStatus)} animate-pulse`}></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getStatusText(botStatus)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Filiais Ativas</span>
                <Badge variant="secondary">4/5</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Msgs Hoje</span>
                <Badge variant="secondary">247</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                <Badge variant="secondary">99.8%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">1,247</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mensagens Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">8,543</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mensagens Semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">32,149</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mensagens Mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">5</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Filiais Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Log de Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentMessages.map((msg, index) => (
              <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400 min-w-[50px]">
                  {msg.time}
                </div>
                <Badge variant="outline" className="min-w-fit">
                  {msg.branch}
                </Badge>
                <div className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
