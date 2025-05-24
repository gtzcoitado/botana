
import React, { useState } from 'react';
import { BarChart3, Calendar, Clock, TrendingUp, MessageSquare, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const messagesByDay = [
    { day: 'Seg', messages: 45 },
    { day: 'Ter', messages: 52 },
    { day: 'Qua', messages: 38 },
    { day: 'Qui', messages: 61 },
    { day: 'Sex', messages: 75 },
    { day: 'Sáb', messages: 29 },
    { day: 'Dom', messages: 18 },
  ];

  const messagesByBranch = [
    { branch: 'Filial Centro', messages: 156, growth: '+12%' },
    { branch: 'Filial Norte', messages: 134, growth: '+8%' },
    { branch: 'Filial Sul', messages: 98, growth: '-3%' },
    { branch: 'Filial Leste', messages: 87, growth: '+15%' },
  ];

  const busyHours = [
    { hour: '08h', intensity: 20 },
    { hour: '09h', intensity: 35 },
    { hour: '10h', intensity: 60 },
    { hour: '11h', intensity: 85 },
    { hour: '12h', intensity: 45 },
    { hour: '13h', intensity: 30 },
    { hour: '14h', intensity: 70 },
    { hour: '15h', intensity: 90 },
    { hour: '16h', intensity: 80 },
    { hour: '17h', intensity: 55 },
    { hour: '18h', intensity: 25 },
  ];

  const topCommands = [
    { command: 'Horários de funcionamento', count: 156, percentage: 32 },
    { command: 'Lista de produtos', count: 134, percentage: 28 },
    { command: 'Formas de pagamento', count: 98, percentage: 20 },
    { command: 'Localização da loja', count: 67, percentage: 14 },
    { command: 'Contato do responsável', count: 29, percentage: 6 },
  ];

  const commandsData = topCommands.map(cmd => ({
    name: cmd.command,
    value: cmd.count
  }));

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
        <div className="flex space-x-2">
          {['day', 'week', 'month'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'day' && 'Hoje'}
              {period === 'week' && 'Semana'}
              {period === 'month' && 'Mês'}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">1,247</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Mensagens</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">4</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Filiais Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">+15%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Crescimento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">15h</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pico de Uso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages by Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Mensagens por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={messagesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messages" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Busy Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Horários de Maior Movimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={busyHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="intensity" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages by Branch */}
        <Card>
          <CardHeader>
            <CardTitle>Mensagens por Filial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messagesByBranch.map((branch, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium">{branch.branch}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {branch.messages} mensagens
                    </div>
                  </div>
                  <Badge variant={branch.growth.startsWith('+') ? "default" : "destructive"}>
                    {branch.growth}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Commands */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Comandos Mais Usados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCommands.map((command, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{command.command}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {command.count} ({command.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${command.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commands Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Comandos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={commandsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {commandsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
