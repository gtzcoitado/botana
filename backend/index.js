// backend/index.js

require('dotenv').config();
const fs        = require('fs');
const path      = require('path');
const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');
const axios     = require('axios');
const FormData  = require('form-data');
const QRCode    = require('qrcode');
const ffmpeg    = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// aponta o path correto pro binário
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ————————————————————————————————————————————
// 0) garante pasta de sessão
const SESSIONS_PATH = path.join(__dirname, 'session');
if (!fs.existsSync(SESSIONS_PATH)) fs.mkdirSync(SESSIONS_PATH);

// ————————————————————————————————————————————
// 1) conecta no MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => {
  console.error('❌ falha MongoDB', err);
  process.exit(1);
});

// ————————————————————————————————————————————
// 2) Schemas e Models

const InfoSchema = new mongoose.Schema({
  title:    String,
  content:  String,
  category: String
}, { timestamps: true });
InfoSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { ret.id = ret._id; delete ret._id; }
});

const BranchSchema = new mongoose.Schema({
  name:             String,
  phone:            String,
  city:             String,
  state:            String,
  address:          String,
  responsible:      String,
  workingHours:     String,
  active:           { type: Boolean, default: true },
  botInstructions:  String,
  infos:            [InfoSchema]
}, { timestamps: true });
BranchSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { ret.id = ret._id; delete ret._id; }
});
const Branch = mongoose.model('Branch', BranchSchema);

const ChatSchema = new mongoose.Schema({
  branchId:   String,
  userId:     String,
  role:       String,    
  text:       String,
  createdAt:  { type: Date, default: Date.now }
});
const Chat = mongoose.model('Chat', ChatSchema);

// ————————————————————————————————————————————
// 3) helpers

// 3.1) converte OGG/Opus em MP3 buffer antes da transcrição
async function convertOggToMp3(buffer) {
  const tmpOgg = path.join(__dirname, 'tmp', `in-${Date.now()}.ogg`);
  const tmpMp3 = path.join(__dirname, 'tmp', `out-${Date.now()}.mp3`);
  // garante pasta tmp
  if (!fs.existsSync(path.join(__dirname,'tmp'))) fs.mkdirSync(path.join(__dirname,'tmp'));
  fs.writeFileSync(tmpOgg, buffer);
  await new Promise((resolve, reject) => {
    ffmpeg(tmpOgg)
      .toFormat('mp3')
      .on('error', reject)
      .on('end', resolve)
      .save(tmpMp3);
  });
  const mp3buf = fs.readFileSync(tmpMp3);
  // limpa temporários
  fs.unlinkSync(tmpOgg);
  fs.unlinkSync(tmpMp3);
  return mp3buf;
}

// 3.2) transcrição de áudio via Whisper (sempre MP3)
async function transcribeAudio(buffer, mimetype) {
  let audioBuffer = buffer;
  let contentType = mimetype;

  // se vier OGG, converte para MP3
  if (mimetype.includes('ogg')) {
    audioBuffer = await convertOggToMp3(buffer);
    contentType = 'audio/mp3';
  }

  const form = new FormData();
  form.append('file', audioBuffer, { filename: 'audio.mp3', contentType });
  form.append('model', 'whisper-1');

  const resp = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    { headers: { 
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 
        ...form.getHeaders() 
      } 
    }
  );
  return resp.data.text.trim();
}

// 3.3) chamada ao Chat Completions com contexto completo
async function callOpenAIWithMessages(messages) {
  const resp = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    { model: 'gpt-4.1-nano', messages, temperature: 0.8, max_tokens: 1000 },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );
  return resp.data.choices[0].message.content.trim();
}

// 3.4) TTS “na mão” via Google Translate
async function textToSpeechBase64(text, lang = 'pt') {
  const url = 'https://translate.google.com/translate_tts' +
    `?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
  const resp = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  return Buffer.from(resp.data, 'binary').toString('base64');
}

// ————————————————————————————————————————————
// 4) gerencia clientes WhatsApp e cache de QR

const clients = new Map();
const qrCache = new Map();
const processedMessages = new Set();

function getClient(branchId) {
  if (!clients.has(branchId)) {
    const client = new Client({
      authStrategy: new LocalAuth({ dataPath: SESSIONS_PATH, clientId: branchId }),
      puppeteer:    { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] }
    });
    const w = { client, ready: false, branchId };
    qrCache.set(branchId, null);

    client.on('qr', qr => qrCache.set(branchId, qr));
    client.on('ready', () => { w.ready = true; console.log(`✅ WhatsApp pronto (${branchId})`); });
    client.on('auth_failure', err => console.error(`❌ auth_fail (${branchId}):`, err));
    client.on('disconnected', () => { w.ready = false; qrCache.set(branchId, null); });

    client.on('message', async msg => {
      if (!w.ready) return;

      // evita duplicação por ID
      if (processedMessages.has(msg.id._serialized)) return;
      processedMessages.add(msg.id._serialized);
      setTimeout(() => processedMessages.delete(msg.id._serialized), 5 * 60 * 1000);

      // DEBUG (você pode retirar depois)
      console.log('🔔 NOVA MSG:', { id: msg.id._serialized, type: msg.type, hasMedia: msg.hasMedia });

      // 4.2) busca e valida branch
      const b = await Branch.findById(branchId).lean();
      if (!b || !b.active) return;

      // 4.3) extrai texto ou transcrição de áudio
      let userText = '';
      if (msg.hasMedia) {
        try {
          const media = await msg.downloadMedia();
          if (media.mimetype.startsWith('audio/')) {
            const buf = Buffer.from(media.data, 'base64');
            userText = await transcribeAudio(buf, media.mimetype);
          }
        } catch(e) {
          console.error('falha downloadMedia/transcrição:', e.message);
        }
      }
      if (!userText) {
        userText = msg.body || '';
      }

      // 4.4) checa 1ª interação
      const userId = msg.from;
      const previousCount = await Chat.countDocuments({ branchId, userId, role: 'user' });
      const isFirst = previousCount === 0;

      // 4.5) salva msg do usuário
      await Chat.create({ branchId, userId, role: 'user', text: userText });

      // 4.6) monta instruções (saudação condicional + custom)
      const baseInst = (b.botInstructions||`
Você é a atendente virtual da filial ${b.name}.
Seu objetivo é oferecer um atendimento acolhedor, simpático e direto ao ponto.
`).trim();
      const greetingRule = isFirst
        ? 'Inclua uma saudação adequada no início da resposta.'
        : 'Não inclua saudação inicial.';
      const instructions = [
        baseInst,
        'Ao receber a mensagem do cliente, siga:',
        '1. Leia atentamente o texto e entenda o contexto.',
        `2. ${greetingRule}`,
        '3. Responda em UMA ÚNICA mensagem.',
        '4. Seja coerente e trate diretamente o que o cliente perguntou.',
        '5. Use tom amigável e profissional.'
      ].join('\n');

      // monta systemPrompt
      const infosText = b.infos.map(i => `- ${i.title} (${i.category}): ${i.content}`).join('\n') || 'Nenhuma.';
      const systemPrompt = `
${instructions}

Localização: ${b.city}, ${b.state}${b.address?`, ${b.address}`:''}.
Horário: ${b.workingHours||'não informado'}.

Informações adicionais:
${infosText}`.trim();

      // 4.7) carrega TODO histórico
      const history = await Chat.find({ branchId, userId }).sort({ createdAt: 1 });

      // 4.8) prepara contexto para OpenAI
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.text })),
        { role: 'user', content: userText }
      ];

      // 4.9) chama OpenAI
      let replyText;
      try {
        replyText = await callOpenAIWithMessages(messages);
      } catch {
        replyText = 'Desculpe, ocorreu um problema interno. Tente mais tarde.';
      }

      // 4.10) salva resposta e envia (áudio + texto)
      await Chat.create({ branchId, userId, role: 'assistant', text: replyText });
      try {
        const base64 = await textToSpeechBase64(replyText, 'pt');
        const audio  = new MessageMedia('audio/mp3', base64, 'reply.mp3');
        await msg.reply(audio);
      } catch {
        await msg.reply(replyText);
      }
    });

    client.initialize();
    clients.set(branchId, w);
  }
  return clients.get(branchId);
}

// ————————————————————————————————————————————
// 5) Express + rotas

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/branches/:id/connect', (req, res) => {
  const w = getClient(req.params.id);
  if (w.ready) return res.json({ connected: true });
  const qr = qrCache.get(req.params.id);
  if (qr) {
    return QRCode.toDataURL(qr).then(url => res.json({ qr: url }))
                              .catch(() => res.status(500).json({ error: 'QR gen fail' }));
  }
  res.status(202).json({ status: 'pending' });
});
app.get('/api/branches/:id/status', (req, res) =>
  res.json({ connected: !!clients.get(req.params.id)?.ready })
);
app.get('/api/branches',        async (_, r) => r.json(await Branch.find()));
app.post('/api/branches',       async (req, r) => r.status(201).json(await Branch.create(req.body)));
app.put('/api/branches/:id',    async (req, r) => {
  const u = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!u) return r.sendStatus(404);
  r.json(u);
});
app.delete('/api/branches/:id', async (req, r) => {
  const d = await Branch.findByIdAndDelete(req.params.id);
  if (!d) return r.sendStatus(404);
  r.json({ ok: true });
});
app.get('/api/branches/:id/infos',           async (req, r) => {
  const b = await Branch.findById(req.params.id);
  if (!b) return r.sendStatus(404);
  r.json(b.infos);
});
app.post('/api/branches/:id/infos',          async (req, r) => {
  const b = await Branch.findById(req.params.id);
  if (!b) return r.sendStatus(404);
  b.infos.push(req.body);
  await b.save();
  r.status(201).json(b.infos);
});
app.put('/api/branches/:id/infos/:infoId',   async (req, r) => {
  const b = await Branch.findById(req.params.id);
  if (!b) return r.sendStatus(404);
  const i = b.infos.id(req.params.infoId);
  if (!i) return r.sendStatus(404);
  i.set(req.body);
  await b.save();
  r.json(b.infos);
});
app.delete('/api/branches/:id/infos/:infoId', async (req, r) => {
  const b = await Branch.findById(req.params.id);
  if (!b) return r.sendStatus(404);
  b.infos.id(req.params.infoId).remove();
  await b.save();
  r.json({ ok: true });
});

// rota de histórico completo
app.get('/api/branches/:id/chats/:userId', async (req, res) => {
  const chats = await Chat.find({ branchId: req.params.id, userId: req.params.userId }).sort({ createdAt: 1 });
  res.json(chats);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log('🚀 API rodando na porta', PORT));
