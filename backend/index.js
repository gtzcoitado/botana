// index.js
require('dotenv').config();

const path     = require('path');
const express  = require('express');
const cors     = require('cors');
const axios    = require('axios');
const qrcode   = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const mongoose = require('mongoose');

// ——— Conexão com MongoDB ———
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => {
  console.error('❌ Erro conectando ao MongoDB:', err);
  process.exit(1);
});

// ——— Schema e Model de “conteúdo” das pizzarias ———
const RestaurantSchema = new mongoose.Schema({
  key:  { type: String, unique: true },
  name: String,
  data: mongoose.Mixed        // aqui você guarda o que quiser: texto, JSON, cards…
});
const Restaurant = mongoose.model('Restaurant', RestaurantSchema);

// ——— Helper OpenAI ———
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

// ——— Inicialização do WhatsApp Web ———
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.resolve(__dirname, process.env.SESSION_PATH || 'session'),
    clientId: 'assistant'
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox']
  }
});

client.on('qr', qr => {
  console.log('📲 Escaneie este QR (só na 1ª vez):');
  qrcode.generate(qr, { small: true });
});
client.on('ready', () => console.log('✅ WhatsApp Web pronto'));

// ——— Handler de mensagens ———
client.on('message', async msg => {
  const text = (msg.body||'').trim();
  const chat = msg.from;

  // Carrega todos os dados que temos de cada pizzaria
  const restos = await Restaurant.find().lean();
  const infoMap = {};
  restos.forEach(r => infoMap[r.key] = r.data);

  // Monta um prompt que faz com que o modelo responda como humano, sem referências a IA
  const systemPrompt = `
Você é a Ana, atendente virtual das pizzarias
“Bom Paladar”, “Casa da Vovó” e “Grano”.
Fale sempre de maneira natural, como um atendente humano:
- Não mencione IA, modelos, ou que você é um robô.
- Seja gentil, direto e verdadeiro.
- Se a pergunta **não** puder ser respondida com os dados abaixo, diga:
  "Ainda não sei disso, mas vou encaminhar para nossos desenvolvedores."
  
Aqui estão os dados disponíveis (JSON):
${JSON.stringify(infoMap, null, 2)}
`.trim();

  try {
    const answer = await callOpenAI(systemPrompt, text);
    return msg.reply(answer);
  } catch (err) {
    console.error('⭐ Erro OpenAI:', err.message);
    return msg.reply('Desculpe, tive um problema interno. Tente novamente mais tarde.');
  }
});

client.initialize();

// ——— API Express para o front-end ———
const app = express();
app.use(cors(), express.json());

// Lista as pizzarias e os dados associados
app.get('/api/restaurants', async (_, res) => {
  const list = await Restaurant.find().select('key name').lean();
  res.json(list);
});

// Retorna o conteúdo completo de uma pizzaria
app.get('/api/restaurants/:key', async (req, res) => {
  const r = await Restaurant.findOne({ key: req.params.key }).lean();
  if (!r) return res.status(404).json({ error: 'Não encontrada' });
  res.json(r);
});

// Cria ou atualiza os dados de uma pizzaria
app.post('/api/restaurants/:key', async (req, res) => {
  const key  = req.params.key;
  const name = req.body.name;
  const data = req.body.data;
  if (!name || !data) {
    return res.status(400).json({ error: 'name e data são obrigatórios' });
  }
  await Restaurant.findOneAndUpdate(
    { key },
    { key, name, data },
    { upsert: true }
  );
  res.json({ ok: true });
});

// Status do bot
app.get('/api/bot/status', (_, res) => {
  const running = client.info && client.info.wid;
  res.json({ running: !!running });
});

// Inicia o servidor HTTP
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 API rodando na porta ${PORT}`)
);
