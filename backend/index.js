// backend/index.js
require('dotenv').config();
const fs        = require('fs');
const path      = require('path');
const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const axios     = require('axios');
const QRCode    = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

// 0) garante pasta de sessão
const SESSIONS_PATH = path.join(__dirname,'session');
if(!fs.existsSync(SESSIONS_PATH)) fs.mkdirSync(SESSIONS_PATH);

// 1) conecta no MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser:true,
  useUnifiedTopology:true,
})
.then(()=> console.log('✅ MongoDB conectado'))
.catch(err=>{ console.error('❌ falha MongoDB',err); process.exit(1); });

// 2) Models
const InfoSchema = new mongoose.Schema({
  title:    String,
  content:  String,
  category: String
},{ timestamps:true });
InfoSchema.set('toJSON',{ virtuals:true, versionKey:false, transform:(_,r)=>{ r.id=r._id; delete r._id; }});

const BranchSchema = new mongoose.Schema({
  name:            String,
  phone:           String,
  city:            String,
  state:           String,
  address:         String,
  responsible:     String,
  workingHours:    String,
  active:          { type:Boolean, default:true },
  botInstructions:String,        // NOVO campo
  infos:           [InfoSchema]
},{ timestamps:true });
BranchSchema.set('toJSON',{ virtuals:true, versionKey:false, transform:(_,r)=>{ r.id=r._id; delete r._id; }});

const Branch = mongoose.model('Branch', BranchSchema);

// 3) helper OpenAI
async function callOpenAI(systemPrompt,userText){
  const resp = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model:'gpt-4o',
      messages:[
        {role:'system',  content: systemPrompt},
        {role:'user',    content: userText}
      ],
      temperature:0.8,
      max_tokens:1000
    },
    { headers:{ Authorization:`Bearer ${process.env.OPENAI_API_KEY}` } }
  );
  return resp.data.choices[0].message.content.trim();
}

// 4) gerencia múltiplos clientes
const clients = new Map(); // branchId → { client, ready, branchId }
function getClient(branchId){
  if(!clients.has(branchId)){
    const client = new Client({
      authStrategy:new LocalAuth({
        dataPath:SESSIONS_PATH,
        clientId:branchId
      }),
      puppeteer:{ headless:true, args:['--no-sandbox','--disable-setuid-sandbox'] }
    });
    const w = { client, ready:false, branchId };
    client.on('ready',()=>{ w.ready=true; console.log(`✅ WhatsApp pronto (${branchId})`) });
    client.on('auth_failure',err=>console.error(`❌ auth_fail (${branchId}):`,err));
    client.on('disconnected',()=>{ w.ready=false; console.warn(`⚠️ desconectado (${branchId})`); });
    client.on('message', async msg=>{
      if(!w.ready) return;
      // carrega a filial e ignora se desativada
      const b = await Branch.findById(branchId).lean();
      if(!b || !b.active) return;
      // monta prompt
      const infosText = b.infos.map(i=>`- ${i.title} (${i.category}): ${i.content}`).join('\n');
      const systemPrompt = `
${b.botInstructions || `Você é a atendente virtual da filial ${b.name}.`}
Localização: ${b.city}, ${b.state}${b.address?`, ${b.address}`:''}.
Horário: ${b.workingHours || 'não informado'}.

Informações adicionais:
${infosText || 'Nenhuma.'}
      `.trim();
      let reply;
      try{ reply = await callOpenAI(systemPrompt,msg.body||''); }
      catch{ reply = 'Desculpe, ocorreram problemas internos. Tente mais tarde.'; }
      msg.reply(reply);
    });
    client.initialize();
    clients.set(branchId,w);
  }
  return clients.get(branchId);
}

// 5) Express + rotas
const app = express();
app.use(cors(), express.json());

// conectar via QR
app.post('/api/branches/:id/connect',(req,res)=>{
  const { client, ready } = getClient(req.params.id);
  if(ready) return res.json({ connected:true });
  client.once('qr', qr=>{
    QRCode.toDataURL(qr)
      .then(url=> res.json({ qr:url }))
      .catch(_=> res.status(500).json({ error:'QR gen fail' }));
  });
});

// status
app.get('/api/branches/:id/status',(req,res)=>{
  const w = clients.get(req.params.id);
  res.json({ connected: !!w?.ready });
});

// CRUD filiais
app.get('/api/branches', async (_,r)=> r.json(await Branch.find()));
app.post('/api/branches',async(req,r)=>{ r.status(201).json(await Branch.create(req.body)); });
app.put('/api/branches/:id',async(req,r)=>{
  const u = await Branch.findByIdAndUpdate(req.params.id,req.body,{new:true});
  if(!u) return r.sendStatus(404);
  r.json(u);
});
app.delete('/api/branches/:id',async(req,r)=>{
  const d = await Branch.findByIdAndDelete(req.params.id);
  if(!d) return r.sendStatus(404);
  r.json({ ok:true });
});

// CRUD infos
app.get('/api/branches/:id/infos',async(req,r)=>{
  const b = await Branch.findById(req.params.id);
  if(!b) return r.sendStatus(404);
  r.json(b.infos);
});
app.post('/api/branches/:id/infos',async(req,r)=>{
  const b = await Branch.findById(req.params.id);
  if(!b) return r.sendStatus(404);
  b.infos.push(req.body);
  await b.save();
  r.status(201).json(b.infos);
});
app.put('/api/branches/:id/infos/:infoId',async(req,r)=>{
  const b = await Branch.findById(req.params.id);
  if(!b) return r.sendStatus(404);
  const i = b.infos.id(req.params.infoId);
  if(!i) return r.sendStatus(404);
  i.set(req.body);
  await b.save();
  r.json(b.infos);
});
app.delete('/api/branches/:id/infos/:infoId',async(req,r)=>{
  const b = await Branch.findById(req.params.id);
  if(!b) return r.sendStatus(404);
  b.infos.id(req.params.infoId).remove();
  await b.save();
  r.json({ ok:true });
});

app.listen(process.env.PORT||4000,'0.0.0.0',()=>console.log('🚀 API rodando na porta',process.env.PORT||4000));
