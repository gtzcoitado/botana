// src/components/Branches.tsx
import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, MapPin, Phone, User, Info as InfoIcon, Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';

interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
  phone: string;
  address?: string;
  responsible: string;
  active: boolean;
  workingHours: string;
  botInstructions: string;   // NOVO campo
}

export const Branches: React.FC<{ onManageInfo?: any }> = ({ onManageInfo }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch|null>(null);
  const [formData, setFormData] = useState<Partial<Branch>>({});
  const [connectionStatus, setConnectionStatus] = useState<Record<string,boolean>>({});
  const [connectingBranch, setConnectingBranch] = useState<string|null>(null);
  const [qrModalBranch, setQrModalBranch] = useState<string|null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const API = 'http://localhost:4000/api/branches';

  useEffect(()=>{
    (async()=>{
      const res = await fetch(API);
      const data = await res.json();
      setBranches(data);
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{
    const iv = setInterval(()=>{
      branches.forEach(b=>{
        fetch(`${API}/${b.id}/status`).then(r=>r.json()).then(js=>{
          setConnectionStatus(cs=>({...cs,[b.id]: js.connected}));
        }).catch(_=>{
          setConnectionStatus(cs=>({...cs,[b.id]: false}));
        });
      });
    },5000);
    return ()=>clearInterval(iv);
  },[branches]);

  if(loading) return <p>Carregando filiais…</p>;

  const handleAdd = () => {
    setEditingBranch(null);
    setFormData({});
    setIsDialogOpen(true);
  };
  const handleEdit = (b:Branch) => {
    setEditingBranch(b);
    setFormData(b);
    setIsDialogOpen(true);
  };
  const handleSave = async()=>{
    const payload = {
      name:            formData.name||'',
      city:            formData.city||'',
      state:           formData.state||'',
      phone:           formData.phone||'',
      address:         formData.address||'',
      responsible:     formData.responsible||'',
      workingHours:    formData.workingHours||'',
      botInstructions: formData.botInstructions||'',  // envia
      active:          formData.active??true
    };
    let saved:Branch;
    if(editingBranch){
      const res = await fetch(`${API}/${editingBranch.id}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      saved = await res.json();
      setBranches(bs=>bs.map(x=> x.id===saved.id? saved: x));
    } else {
      const res = await fetch(API,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      saved = await res.json();
      setBranches(bs=>[...bs, saved]);
    }
    setIsDialogOpen(false);
  };
  const handleDel = async(id:string)=>{
    await fetch(`${API}/${id}`,{method:'DELETE'});
    setBranches(bs=>bs.filter(x=>x.id!==id));
  };
  const toggleActive = async(id:string)=>{
    const b = branches.find(x=>x.id===id); if(!b) return;
    const res = await fetch(`${API}/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...b,active:!b.active})
    });
    const upd = await res.json();
    setBranches(bs=>bs.map(x=> x.id===upd.id? upd: x));
  };

  const handleConnect = async(branchId:string)=>{
    setConnectingBranch(branchId);
    try{
      const res = await fetch(`${API}/${branchId}/connect`,{method:'POST'});
      const js = await res.json();
      if(js.connected){
        setConnectionStatus(cs=>({...cs,[branchId]:true}));
        setQrModalBranch(null);
      } else if(js.qr){
        setQrCodeUrl(js.qr);
        setQrModalBranch(branchId);
      }
    }catch(err){
      console.error(err);
    }finally{
      setConnectingBranch(null);
    }
  };

  return (
  <>
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Gerenciamento de Filiais</h1>
        <Button onClick={handleAdd} className="bg-green-500 hover:bg-green-600">
          <Plus className="mr-2 h-4 w-4"/> Nova Filial
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(b=>(
          <Card key={b.id} className="hover:shadow-lg">
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle>{b.name}</CardTitle>
                <Badge variant={b.active?'default':'secondary'}>
                  {b.active?'Ativo':'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center"><MapPin className="mr-2"/> {b.city}, {b.state}</div>
                <div className="flex items-center"><Phone className="mr-2"/> {b.phone}</div>
                <div className="flex items-center"><User className="mr-2"/> {b.responsible}</div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch checked={b.active} onCheckedChange={()=>toggleActive(b.id)}/>
                <span>Bot ativo</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={()=>handleEdit(b)}>
                  <Edit className="mr-1 h-3 w-3"/> Editar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={()=>handleConnect(b.id)}
                  disabled={!!connectionStatus[b.id] || connectingBranch===b.id}
                  className="flex justify-center items-center"
                >
                  {connectingBranch===b.id
                    ? <><Loader2 className="mr-1 h-4 w-4 animate-spin"/> Carregando...</>
                    : connectionStatus[b.id]
                      ? 'Conectado'
                      : 'Conectar WhatsApp'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={()=> onManageInfo?.(b.id,b.name) }
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                >
                  <InfoIcon className="mr-1 h-3 w-3"/> Informações
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={()=>handleDel(b.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3"/> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {/* Modal QR */}
    <Dialog open={qrModalBranch!==null} onOpenChange={()=>setQrModalBranch(null)}>
      <DialogContent className="max-w-xs mx-auto">
        <DialogHeader>
          <DialogTitle>Escaneie o QR no WhatsApp</DialogTitle>
        </DialogHeader>
        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="mx-auto"/>}
      </DialogContent>
    </Dialog>

    {/* Modal Add/Edit */}
    <Dialog open={isDialogOpen} onOpenChange={()=>setIsDialogOpen(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingBranch?'Editar Filial':'Nova Filial'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Filial</Label>
            <Input
              id="name"
              value={formData.name||''}
              onChange={e=>setFormData({...formData,name:e.target.value})}
              placeholder="Ex: Filial Centro"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">WhatsApp</Label>
            <Input
              id="phone"
              value={formData.phone||''}
              onChange={e=>setFormData({...formData,phone:e.target.value})}
              placeholder="+55 11 99999-9999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={formData.city||''}
              onChange={e=>setFormData({...formData,city:e.target.value})}
              placeholder="São Paulo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              value={formData.state||''}
              onChange={e=>setFormData({...formData,state:e.target.value})}
              placeholder="SP"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Endereço (opcional)</Label>
            <Input
              id="address"
              value={formData.address||''}
              onChange={e=>setFormData({...formData,address:e.target.value})}
              placeholder="Rua das Flores, 123"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsible">Responsável</Label>
            <Input
              id="responsible"
              value={formData.responsible||''}
              onChange={e=>setFormData({...formData,responsible:e.target.value})}
              placeholder="João Silva"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workingHours">Horário de Atendimento</Label>
            <Input
              id="workingHours"
              value={formData.workingHours||''}
              onChange={e=>setFormData({...formData,workingHours:e.target.value})}
              placeholder="08:00 - 18:00"
            />
          </div>
          {/* --- NOVO campo: Instruções do Bot --- */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="botInstructions">Instruções do Bot</Label>
            <Textarea
              id="botInstructions"
              value={formData.botInstructions||''}
              onChange={e=>setFormData({...formData,botInstructions:e.target.value})}
              placeholder="Ex: Você é a Ana, assistente virtual da filial X..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={()=>setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
};
