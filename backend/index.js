// index.js
require('dotenv').config();

const fs        = require('fs');
const path      = require('path');
const express   = require('express');
const cors      = require('cors');
const axios     = require('axios');
const chrono    = require('chrono-node');
const { v4: uuidv4 } = require('uuid');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode    = require('qrcode-terminal');

// ——— Configurações iniciais ———
const DATA_DIR = path.join(__dirname, 'restaurant_data');
const RES_FILE = path.join(__dirname, 'reservations.json');
let reservations = fs.existsSync(RES_FILE)
  ? JSON.parse(fs.readFileSync(RES_FILE, 'utf8'))
  : [];
const pending = {};       // pending[chatId] = { id, stage, restaurant, name, party, date }
let botRunning = true;

// ——— Helpers de pizzaria ———
function detectRestaurant(text) {
  const t = text.toLowerCase();
  if (t.includes('bom paladar'))    return 'bom-paladar';
  if (t.includes('casa da vovó') || t.includes('casa da vovo')) return 'casa-da-vovo';
  if (t.includes('grano'))          return 'grano';
  return null;
}
function getRestaurantName(key) {
  const map = {
    'bom-paladar':'Bom Paladar',
    'casa-da-vovo':'Casa da Vovó',
    'grano':'Grano'
  };
  return map[key] || key;
}

// ——— Abstrai chamada ao OpenAI ———
async function callOpenAI(systemPrompt, userText) {
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userText }
      ],
      temperature: 0.7,
      max_tokens: 1500
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );
  return res.data.choices[0].message.content.trim();
}

// ——— Usa GPT para extrair slots de reserva ———
async function extractSlots(message) {
  const prompt = `
Você é um parser de mensagem de reserva de pizzaria.
Retorne APENAS um JSON com 4 campos:
- restaurant: "bom-paladar" | "casa-da-vovo" | "grano" ou null
- name: string (nome do responsável) ou null
- party: inteiro (número de pessoas) ou null
- date: string ISO 8601 (yyyy-mm-ddTHH:MM:SS) ou null

Interprete "hoje", "amanhã", "16/05/2025 18:30", etc.
Exemplo de saída:
{"restaurant":"bom-paladar","name":"Nathan","party":4,"date":"2025-05-16T18:30:00"}
  `.trim();

  try {
    const reply = await callOpenAI(prompt, message);
    return JSON.parse(reply);
  } catch {
    return { restaurant:null, name:null, party:null, date:null };
  }
}

// ——— Inicializa WhatsApp Web com sessão local ———
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, 'session'),
    clientId: 'ana'
  }),
  puppeteer: { headless: true }
});

client.on('qr', qr => {
  console.log('📲 Escaneie este QR apenas UMA vez:');
  qrcode.generate(qr, { small: true });
});
client.on('ready', () => console.log('✅ WhatsApp Web pronto'));

client.on('message', async msg => {
  if (!botRunning) return;
  const chat = msg.from;
  const text = (msg.body||'').trim();
  const reply = txt => msg.reply(txt);

  // detectar intenção de reserva
  const wantsNew    = /\b(quero|gostaria|preciso|posso)\b.*\b(reserva|reservar)\b/i;
  const saidAlready = /\b(já|ja)\b.*\b(reserva|reservas)\b/i;

  if (!pending[chat]) {
    if (saidAlready.test(text)) {
      return reply(
        'Entendi que você já fez uma reserva. 😉 ' +
        'Se quiser alterar ou cancelar, me avise. Posso ajudar em outra coisa?'
      );
    }
    if (wantsNew.test(text)) {
      pending[chat] = { id: uuidv4(), stage: 'filling' };
      return reply('Show! Manda aí tudo junto: pizzaria, nome, número de pessoas e quando você quer (data/hora).');
    }
  }

  const pb = pending[chat];

  // slot-filling
  if (pb && pb.stage === 'filling') {
    const slots = await extractSlots(text);

    pb.restaurant = pb.restaurant || slots.restaurant;
    pb.name       = pb.name       || slots.name;
    pb.party      = pb.party      || slots.party;
    pb.date       = pb.date       || (slots.date ? new Date(slots.date) : null);

    const missing = [];
    if (!pb.restaurant) missing.push('pizzaria');
    if (!pb.name)       missing.push('nome');
    if (!pb.party)      missing.push('número de pessoas');
    if (!pb.date)       missing.push('data/hora');

    if (missing.length === 0) {
      pb.stage = 'confirm';
      const d = pb.date.toLocaleDateString('pt-BR');
      const h = pb.date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      return reply(
        `Certo! ${getRestaurantName(pb.restaurant)}, para ${pb.name}, ` +
        `${pb.party} pessoas, em ${d} às ${h}. Confirmamos?`
      );
    }

    const last = missing.pop();
    const list = missing.length ? `${missing.join(', ')} e ${last}` : last;
    return reply(`Falta só o ${list}. Pode me passar?`);
  }

  // confirmação
  if (pb && pb.stage === 'confirm') {
    if (/^sim/i.test(text)) {
      reservations.push(pb);
      fs.writeFileSync(RES_FILE, JSON.stringify(reservations,null,2));
      delete pending[chat];
      const d = pb.date.toLocaleDateString('pt-BR');
      const h = pb.date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      return reply(`Demorou! 🎉 Reserva confirmada, ${pb.name}! Te esperamos no ${getRestaurantName(pb.restaurant)} em ${d} às ${h}.`);
    }
    if (/^não|nao/i.test(text)) {
      delete pending[chat];
      return reply('Tranquilo, reserva cancelada. Se precisar de algo, estou por aqui! 😉');
    }
    return reply('Por favor responda apenas “sim” ou “não”.');
  }

  // fallback GPT para outras dúvidas
  const restaurantData = {};
  fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .forEach(f => {
      restaurantData[f.slice(0,-5)] =
        JSON.parse(fs.readFileSync(path.join(DATA_DIR,f),'utf8'));
    });

  const systemPrompt = `
Você é Ana, atendente virtual das pizzarias Bom Paladar, Casa da Vovó e Grano.
Responda de forma natural, usando apenas estes dados.
Se não souber, responda: "Ainda não aprendi isso! Mas vou passar aos meus desenvolvedores 😊"

${JSON.stringify(restaurantData,null,2)}
  `.trim();

  const answer = await callOpenAI(systemPrompt, text);
  return reply(answer);
});

client.initialize();

// ——— Express API para o painel ———
const app = express();
app.use(cors(), express.json());

app.get('/api/bot/status', (_,res) => res.json({ running: botRunning }));
app.post('/api/bot/toggle', (_,res) => {
  botRunning = !botRunning;
  res.json({ running: botRunning });
});

app.get('/api/restaurants', (_,res) => {
  const keys = fs.readdirSync(DATA_DIR)
    .filter(f=>f.endsWith('.json'))
    .map(f=>f.slice(0,-5));
  res.json(keys);
});
app.get('/api/restaurants/:key', (req,res) => {
  const file = path.join(DATA_DIR, req.params.key+'.json');
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.json(JSON.parse(fs.readFileSync(file,'utf8')));
});
app.post('/api/restaurants/:key',(req,res)=>{
  const file = path.join(DATA_DIR, req.params.key+'.json');
  fs.writeFileSync(file, JSON.stringify(req.body,null,2), 'utf8');
  res.json({ ok:true });
});

app.get('/api/reservations', (_,res) => res.json(reservations));
app.delete('/api/reservations/:id', (req,res) => {
  reservations = reservations.filter(r=>r.id!==req.params.id);
  fs.writeFileSync(RES_FILE, JSON.stringify(reservations,null,2));
  res.json({ ok:true });
});

const PORT = process.env.PORT_API||4000;
app.listen(PORT, ()=>console.log(`🚀 API rodando em http://localhost:${PORT}`));
