import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

interface BranchInfo {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface BranchInfoProps {
  branchId: string;
  branchName: string;
  onBack?: () => void;
}

export const BranchInfo: React.FC<BranchInfoProps> = ({ branchId, branchName, onBack }) => {
  const [infos, setInfos] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState<BranchInfo | null>(null);
  const [formData, setFormData] = useState<Partial<BranchInfo>>({});

  const API = `http://localhost:4000/api/branches/${branchId}/infos`;
  const categories = ['Horários','Produtos','Pagamento','Delivery','Contato','Promoções','Outros'];

  // ── carrega infos ao montar ──
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API);
        const data: BranchInfo[] = await res.json();
        setInfos(data);
      } catch {
        console.error('Erro ao carregar infos');
      } finally {
        setLoading(false);
      }
    })();
  }, [API]);

  if (loading) return <p>Carregando informações…</p>;

  const handleAddInfo = () => {
    setEditingInfo(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  const handleEditInfo = (info: BranchInfo) => {
    setEditingInfo(info);
    setFormData(info);
    setIsDialogOpen(true);
  };

  const handleSaveInfo = async () => {
    const payload = {
      title:    formData.title || '',
      content:  formData.content || '',
      category: formData.category || 'Outros'
    };

    let updated: BranchInfo[];
    if (editingInfo) {
      const res = await fetch(`${API}/${editingInfo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      updated = await res.json();
    } else {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      updated = await res.json();
    }
    setInfos(updated);
    setIsDialogOpen(false);
  };

  const handleDeleteInfo = async (infoId: string) => {
    await fetch(`${API}/${infoId}`, { method: 'DELETE' });
    setInfos(infos.filter(i => i.id !== infoId));
  };

  const getCategoryClass = (cat: string) => {
    const map: Record<string,string> = {
      'Horários':  'bg-blue-100 text-blue-800',
      'Produtos':  'bg-green-100 text-green-800',
      'Pagamento': 'bg-yellow-100 text-yellow-800',
      'Delivery':  'bg-purple-100 text-purple-800',
      'Contato':   'bg-pink-100 text-pink-800',
      'Promoções': 'bg-red-100 text-red-800',
      'Outros':    'bg-gray-100 text-gray-800'
    };
    return map[cat] || map['Outros'];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        )}
        <h1 className="text-2xl font-bold">
          Informações – {branchName}
        </h1>
        <Button onClick={handleAddInfo} className="bg-green-500 hover:bg-green-600">
          <Plus className="mr-2 h-4 w-4" /> Nova Informação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {infos.map(info => (
          <Card key={info.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{info.title}</CardTitle>
                <span className={`px-2 py-1 text-xs rounded ${getCategoryClass(info.category)}`}>
                  {info.category}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">
                {info.content}
              </div>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => handleEditInfo(info)}>
                  <Edit className="mr-1 h-3 w-3" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeleteInfo(info.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo Add/Edit Info */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInfo ? 'Editar Informação' : 'Nova Informação'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Horários de Funcionamento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <select
                id="category"
                value={formData.category || 'Outros'}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={formData.content || ''}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Digite o conteúdo que o bot enviará aos clientes..."
                rows={5}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-1 h-3 w-3" /> Cancelar
            </Button>
            <Button onClick={handleSaveInfo} className="bg-green-500 hover:bg-green-600">
              <Save className="mr-1 h-3 w-3" /> Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
);
}