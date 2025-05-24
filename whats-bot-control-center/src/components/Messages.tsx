
import React, { useState } from 'react';
import { Send, Calendar, Clock, Building2, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';

interface ScheduledMessage {
  id: string;
  content: string;
  targetBranches: string[];
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
}

interface SentMessage {
  id: string;
  content: string;
  targetBranches: string[];
  sentAt: string;
  status: 'success' | 'failed';
}

export const Messages: React.FC = () => {
  const [message, setMessage] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  const branches = [
    { id: 'all', name: 'Todas as Filiais' },
    { id: '1', name: 'Filial Centro' },
    { id: '2', name: 'Filial Norte' },
    { id: '3', name: 'Filial Sul' },
  ];

  const [scheduledMessages] = useState<ScheduledMessage[]>([
    {
      id: '1',
      content: 'Promoção especial de Black Friday! 50% de desconto em todos os produtos.',
      targetBranches: ['Todas as Filiais'],
      scheduledDate: '2024-11-29',
      scheduledTime: '09:00',
      status: 'pending',
      createdAt: '2024-05-24 14:30'
    },
    {
      id: '2',
      content: 'Lembrete: Nossa filial do Centro funcionará em horário especial amanhã.',
      targetBranches: ['Filial Centro'],
      scheduledDate: '2024-05-25',
      scheduledTime: '08:00',
      status: 'pending',
      createdAt: '2024-05-24 13:15'
    }
  ]);

  const [sentMessages] = useState<SentMessage[]>([
    {
      id: '1',
      content: 'Bem-vindos ao nosso novo sistema de atendimento automático!',
      targetBranches: ['Todas as Filiais'],
      sentAt: '2024-05-24 10:30',
      status: 'success'
    },
    {
      id: '2',
      content: 'Manutenção programada no sistema será realizada hoje às 23h.',
      targetBranches: ['Filial Norte', 'Filial Sul'],
      sentAt: '2024-05-23 16:45',
      status: 'success'
    }
  ]);

  const handleBranchSelection = (branchId: string) => {
    if (branchId === 'all') {
      setSelectedBranches(['all']);
    } else {
      const newSelection = selectedBranches.includes(branchId)
        ? selectedBranches.filter(id => id !== branchId && id !== 'all')
        : [...selectedBranches.filter(id => id !== 'all'), branchId];
      setSelectedBranches(newSelection);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      alert('Por favor, defina data e horário para o agendamento.');
      return;
    }

    const targetNames = selectedBranches.includes('all') 
      ? ['Todas as Filiais']
      : selectedBranches.map(id => branches.find(b => b.id === id)?.name || '');

    if (isScheduled) {
      alert(`Mensagem agendada para ${scheduledDate} às ${scheduledTime} para: ${targetNames.join(', ')}`);
    } else {
      alert(`Mensagem enviada imediatamente para: ${targetNames.join(', ')}`);
    }

    // Reset form
    setMessage('');
    setSelectedBranches([]);
    setScheduledDate('');
    setScheduledTime('');
    setIsScheduled(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Agendada</Badge>;
      case 'sent':
        return <Badge variant="default">Enviada</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'success':
        return <Badge variant="default">Sucesso</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Central de Mensagens</h1>
      </div>

      {/* Send Message Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Enviar Nova Mensagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Selecionar Filiais</Label>
            <div className="flex flex-wrap gap-2">
              {branches.map((branch) => (
                <Button
                  key={branch.id}
                  variant={selectedBranches.includes(branch.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleBranchSelection(branch.id)}
                >
                  <Building2 className="mr-1 h-3 w-3" />
                  {branch.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="schedule"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="schedule">Agendar mensagem</Label>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleSendMessage} 
            className="w-full bg-green-500 hover:bg-green-600"
            disabled={!message.trim() || selectedBranches.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            {isScheduled ? 'Agendar Mensagem' : 'Enviar Agora'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Mensagens Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledMessages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhuma mensagem agendada
                </p>
              ) : (
                scheduledMessages.map((msg) => (
                  <div key={msg.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="inline mr-1 h-3 w-3" />
                        {msg.scheduledDate} às {msg.scheduledTime}
                      </div>
                      {getStatusBadge(msg.status)}
                    </div>
                    <p className="text-sm mb-2">{msg.content}</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.targetBranches.map((branch, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {branch}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="mr-2 h-5 w-5" />
              Histórico de Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentMessages.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhuma mensagem enviada
                </p>
              ) : (
                sentMessages.map((msg) => (
                  <div key={msg.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {msg.sentAt}
                      </div>
                      {getStatusBadge(msg.status)}
                    </div>
                    <p className="text-sm mb-2">{msg.content}</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.targetBranches.map((branch, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {branch}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
