const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const dbPath = path.join(root, 'data', 'db.json');
const port = Number(process.env.PORT || 8000);
const uemoaCountries = new Set(['Bénin', 'Burkina Faso', "Côte d'Ivoire", 'Guinée-Bissau', 'Mali', 'Niger', 'Sénégal', 'Togo']);
const adminPassword = process.env.ADMIN_PASSWORD;
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

function readDb() { return JSON.parse(fs.readFileSync(dbPath, 'utf8')); }
function writeDb(db) { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); }
function sendJson(res, status, payload) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }); res.end(JSON.stringify(payload)); }
function id() { return crypto.randomUUID(); }
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) { return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`; }
function validPassword(password, stored) { const [salt, key] = stored.split(':'); return crypto.timingSafeEqual(Buffer.from(key, 'hex'), crypto.scryptSync(password, salt, 64)); }
function body(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', chunk => raw += chunk); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('JSON invalide')); } }); }); }
function authUser(req, db) { const token = (req.headers.authorization || '').replace('Bearer ', ''); const session = db.sessions.find(item => item.token === token); return session ? db.users.find(user => user.id === session.userId) : null; }
function authAdmin(req, db) { const token = (req.headers.authorization || '').replace('Bearer ', ''); return db.sessions.find(item => item.token === token && item.admin === true); }
function safeUser(user) { return user && { id: user.id, name: user.name, email: user.email, phone: user.phone, country: user.country, role: user.role, verified: user.verified }; }
function formatOffer(offer) { return { ...offer, budgetLabel: `${Number(offer.budget || 0).toLocaleString('fr-FR')} FCFA`, applicationsCount: offer.applications.length }; }

async function handleApi(req, res, url) {
  const db = readDb();
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method === 'GET' && url.pathname === '/api/health') return sendJson(res, 200, { ok: true, service: 'afric-connect' });
  if (req.method === 'GET' && url.pathname === '/api/offers') return sendJson(res, 200, { offers: db.offers.filter(item => item.status === 'approved').map(formatOffer) });
  if (req.method === 'GET' && url.pathname === '/api/me') { const user = authUser(req, db); return user ? sendJson(res, 200, { user: safeUser(user) }) : sendJson(res, 401, { error: 'Session expirée.' }); }

  let data;
  try { data = await body(req); } catch (error) { return sendJson(res, 400, { error: error.message }); }
  if (req.method === 'POST' && url.pathname === '/api/register') {
    if (!data.name || !data.email || !data.password || data.password.length < 8 || !uemoaCountries.has(data.country)) return sendJson(res, 400, { error: 'Nom, pays UEMOA, email et mot de passe de 8 caractères minimum requis.' });
    if (db.users.some(user => user.email.toLowerCase() === data.email.toLowerCase())) return sendJson(res, 409, { error: 'Cet email est déjà utilisé.' });
    const user = { id: id(), name: data.name.trim(), email: data.email.trim().toLowerCase(), phone: data.phone || '', country: data.country, role: data.role || 'client', password: hashPassword(data.password), verified: false, createdAt: new Date().toISOString() };
    const token = id(); db.users.push(user); db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() }); writeDb(db);
    return sendJson(res, 201, { token, user: safeUser(user) });
  }
  if (req.method === 'POST' && url.pathname === '/api/login') {
    const user = db.users.find(item => item.email === String(data.email || '').toLowerCase());
    if (!user || !data.password || !validPassword(data.password, user.password)) return sendJson(res, 401, { error: 'Email ou mot de passe incorrect.' });
    const token = id(); db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() }); writeDb(db);
    return sendJson(res, 200, { token, user: safeUser(user) });
  }
  if (req.method === 'POST' && url.pathname === '/api/admin/login') {
    if (!adminPassword || !data.password || data.password !== adminPassword) return sendJson(res, 401, { error: 'Identifiants administrateur incorrects.' });
    const token = id(); db.sessions.push({ token, admin: true, createdAt: new Date().toISOString() }); writeDb(db);
    return sendJson(res, 200, { token, admin: true });
  }
  const adminSession = authAdmin(req, db);
  if (url.pathname.startsWith('/api/admin/')) {
    if (!adminSession) return sendJson(res, 401, { error: 'Accès administrateur requis.' });
    if (req.method === 'GET' && url.pathname === '/api/admin/overview') {
      return sendJson(res, 200, { users: db.users.map(safeUser), offers: db.offers.map(formatOffer), stats: { users: db.users.length, offers: db.offers.length, applications: db.offers.reduce((total, offer) => total + offer.applications.length, 0), pending: db.offers.filter(offer => offer.status === 'pending').length } });
    }
    const statusMatch = url.pathname.match(/^\/api\/admin\/offers\/([^/]+)\/status$/);
    if (req.method === 'POST' && statusMatch) {
      const offer = db.offers.find(item => item.id === statusMatch[1]);
      if (!offer || !['approved', 'pending', 'suspended'].includes(data.status)) return sendJson(res, 400, { error: 'Offre ou statut invalide.' });
      offer.status = data.status; writeDb(db); return sendJson(res, 200, { offer: formatOffer(offer) });
    }
    return sendJson(res, 404, { error: 'Route administrateur introuvable.' });
  }
  const user = authUser(req, db);
  if (!user) return sendJson(res, 401, { error: 'Connectez-vous pour continuer.' });
  if (req.method === 'POST' && url.pathname === '/api/offers') {
    if (!data.title || !data.category || !data.city || !data.budget) return sendJson(res, 400, { error: 'Titre, catégorie, ville et budget sont requis.' });
    const offer = { id: id(), title: data.title.trim(), category: data.category, city: data.city.trim(), budget: String(data.budget).replace(/[^0-9]/g, ''), deadline: data.deadline || 'À définir', urgency: data.urgency || 'Moyen', description: data.description || '', status: 'approved', ownerId: user.id, applications: [], createdAt: new Date().toISOString() };
    db.offers.unshift(offer); writeDb(db); return sendJson(res, 201, { offer: formatOffer(offer) });
  }
  const applicationMatch = url.pathname.match(/^\/api\/offers\/([^/]+)\/apply$/);
  if (req.method === 'POST' && applicationMatch) {
    const offer = db.offers.find(item => item.id === applicationMatch[1]);
    if (!offer) return sendJson(res, 404, { error: 'Offre introuvable.' });
    if (offer.ownerId === user.id) return sendJson(res, 400, { error: 'Vous ne pouvez pas postuler à votre propre offre.' });
    if (!offer.applications.some(item => item.userId === user.id)) offer.applications.push({ userId: user.id, message: data.message || '', createdAt: new Date().toISOString() });
    writeDb(db); return sendJson(res, 201, { message: 'Votre candidature a été envoyée.' });
  }
  return sendJson(res, 404, { error: 'Route API introuvable.' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  let requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const filePath = path.normalize(path.join(root, requested));
  if (!filePath.startsWith(root)) return res.writeHead(403).end('Forbidden');
  fs.readFile(filePath, (error, content) => { if (error) return res.writeHead(404).end('Fichier introuvable'); res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' }); res.end(content); });
});

server.listen(port, () => console.log(`AFRIC-CONNECT disponible sur http://localhost:${port}`));
