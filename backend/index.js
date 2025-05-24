// backend/index.js
require('dotenv').config();
const path       = require('path');
const express    = require('express');
const cors       = require('cors');
const axios      = require('axios');
const { Client, LocalAuth } = require('whatsapp-web.js');
const mongoose   = require('mongoose');

// ——— Conexão ao MongoDB ———
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => {
    console.error('❌ Erro conectando ao MongoDB:', err);
    process.exit(1);
  });

// ——— Schema ———
const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({
  key:  { type: String, unique: true },
  name: String,
  data: mongoose.Mixed
}));

// ——— OpenAI helper ———
async function callOpenAI(systemPrompt, userText) {
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userText }
      ],
      temperature: 0.8,
      max_tokens: 1000
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );
  return res.data.choices[0].message.content.trim();
}

// ——— WhatsApp Web usando session/ ———
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, 'session'),
    clientId: 'ana'
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  }
});

client.on('ready', () => console.log('✅ WhatsApp Web pronto'));
client.on('message', async msg => {
  const text = (msg.body||'').trim();
  const restos = await Restaurant.find().lean();
  const infoMap = {};
  restos.forEach(r => infoMap[r.key] = r.data);

  const systemPrompt = `
Você é a Ana, atendente das pizzarias “Bom Paladar”, “Casa da Vovó” e “Grano”.
Fale como um humano, sem mencionar IA.
Se não souber algo, responda:
"Ainda não sei disso, mas vou encaminhar para nossos desenvolvedores."

Dados:
${JSON.stringify(infoMap,null,2)}
  `.trim();

  let reply;
  try { reply = await callOpenAI(systemPrompt, text); }
  catch { reply = 'Desculpe, ocorreu um erro interno. Tente mais tarde.'; }
  msg.reply(reply);
});

client.initialize();

// ——— Express API ———
const app = express();
app.use(cors(), express.json());

app.get('/api/restaurants', async (_,res) =>
  res.json(await Restaurant.find().select('key name').lean())
);

app.get('/api/restaurants/:key', async (req,res) => {
  const r = await Restaurant.findOne({ key: req.params.key }).lean();
  if (!r) return res.status(404).json({ error: 'Não encontrada' });
  res.json(r);
});

app.post('/api/restaurants/:key', async (req,res) => {
  const { name, data } = req.body;
  if (!name||!data) return res.status(400).json({ error:'name e data obrigatórios' });
  await Restaurant.findOneAndUpdate(
    { key: req.params.key },
    { key: req.params.key, name, data },
    { upsert: true }
  );
  res.json({ ok:true });
});

app.get('/api/bot/status', (_,res) =>
  res.json({ running: !!(client.info && client.info.wid) })
);

const PORT = process.env.PORT||4000;
app.listen(PORT,'0.0.0.0',()=>
  console.log(`🚀 API rodando na porta ${PORT}`)
);
