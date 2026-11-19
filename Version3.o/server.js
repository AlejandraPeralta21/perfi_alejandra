/* Servidor local opcional: sirve la PWA por localhost y confirma la cola en POST /api/contact.
   EJECUCIÓN: proceso Node.js del equipo, iniciado desde PowerShell con `node server.js`.
   CONTEXTO: atiende HTTP en localhost:4173; no se ejecuta dentro del navegador ni del Service Worker. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
// Node 24 incluye SQLite integrado; no se instala ni descarga una dependencia adicional.
const { DatabaseSync } = require('node:sqlite');

const ROOT = __dirname;
// Si existe una compilación de Vite, se publica dist/; sin ella, sirve los archivos fuente.
const DIST_DIRECTORY = path.join(ROOT, 'dist');
const WEB_ROOT = fs.existsSync(path.join(DIST_DIRECTORY, 'index.html')) ? DIST_DIRECTORY : ROOT;
const DATA_DIRECTORY = path.join(ROOT, 'data');
const MESSAGE_FILE = path.join(DATA_DIRECTORY, 'messages.json');
const DATABASE_FILE = path.join(DATA_DIRECTORY, 'messages.sqlite');
const PORT = Number(process.env.PORT) || 4173;
const HOST = '127.0.0.1'; // El servidor de demostración solo escucha en este equipo.
const MAX_BODY_BYTES = 65536;
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};

function sendJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

// Base de datos local para los envíos del formulario. El payload JSON conserva los campos actuales sin cambiar el cliente.
fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
const database = new DatabaseSync(DATABASE_FILE);
database.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    server_received_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_contact_messages_received
    ON contact_messages(server_received_at DESC);
`);

// Importación única: mensajes del formato JSON anterior se copian a SQLite y no se duplican por su ID.
function migrateLegacyMessages() {
  try {
    const list = JSON.parse(fs.readFileSync(MESSAGE_FILE, 'utf8'));
    if (!Array.isArray(list)) return;
    const insert = database.prepare(
      'INSERT OR IGNORE INTO contact_messages (id, payload, server_received_at) VALUES (?, ?, ?)'
    );
    database.exec('BEGIN');
    try {
      list.forEach(function (message) {
        if (!message || message.id == null || String(message.id) === '') return;
        const receivedAt = message.serverReceivedAt || message.createdAt || new Date().toISOString();
        insert.run(String(message.id), JSON.stringify(message), String(receivedAt));
      });
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
}
migrateLegacyMessages();

const findMessage = database.prepare('SELECT id FROM contact_messages WHERE id = ?');
const insertMessage = database.prepare(
  'INSERT INTO contact_messages (id, payload, server_received_at) VALUES (?, ?, ?)'
);

async function handleContactPost(request, response) {
  let raw = '';
  let tooLarge = false;
  request.on('data', function (chunk) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) tooLarge = true;
  });
  request.on('end', async function () {
    if (tooLarge) return sendJson(response, 413, { ok: false, error: 'El mensaje es demasiado grande.' });
    let message;
    try { message = JSON.parse(raw); }
    catch (error) { return sendJson(response, 400, { ok: false, error: 'JSON no válido.' }); }

    const name = String(message.name || '').trim();
    const email = String(message.email || '').trim();
    const phone = String(message.phone || '').trim();
    const countryCode = String(message.countryCode || '').trim();
    const preference = String(message.contactPreference || '').trim();
    if (name.length < 2 || /\d/.test(name)) return sendJson(response, 400, { ok: false, error: 'Nombre no válido.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(response, 400, { ok: false, error: 'Correo no válido.' });
    if (phone && (!/^\d{8}$/.test(phone) || !/^\+\d{1,4}$/.test(countryCode))) return sendJson(response, 400, { ok: false, error: 'Teléfono no válido.' });
    if (preference === 'WhatsApp' && !phone) return sendJson(response, 400, { ok: false, error: 'WhatsApp requiere teléfono.' });
    if (!message.reason || !String(message.subject || '').trim() || String(message.subject || '').trim().length < 3 || String(message.message || '').trim().length < 10) {
      return sendJson(response, 400, { ok: false, error: 'Completa los datos del mensaje.' });
    }

    try {
      const id = String(message.id || '');
      if (!id) return sendJson(response, 400, { ok: false, error: 'Falta el identificador del mensaje.' });
      const existing = findMessage.get(id);
      if (existing) return sendJson(response, 200, { ok: true, id: id, duplicate: true });
      const serverReceivedAt = new Date().toISOString();
      const storedMessage = Object.assign({}, message, {
        id: id,
        syncStatus: 'synced',
        serverReceivedAt: serverReceivedAt
      });
      // Los parámetros SQL evitan concatenar datos del formulario dentro de la consulta.
      insertMessage.run(id, JSON.stringify(storedMessage), serverReceivedAt);
      sendJson(response, 201, { ok: true, id: id });
    } catch (error) {
      sendJson(response, 500, { ok: false, error: 'No se pudo guardar en el servidor.' });
    }
  });
}

const server = http.createServer(function (request, response) {
  const url = new URL(request.url, 'http://' + request.headers.host);
  if (url.pathname === '/api/contact' && request.method === 'POST') return handleContactPost(request, response);
  if (url.pathname.startsWith('/api/')) return sendJson(response, 404, { ok: false, error: 'Ruta API no encontrada.' });

  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch (error) { response.writeHead(400).end('URL no válida.'); return; }
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.resolve(WEB_ROOT, '.' + pathname);
  let resolvedFilePath = filePath;
  const relative = path.relative(WEB_ROOT, resolvedFilePath);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative === 'data' || relative.startsWith('data' + path.sep)) {
    response.writeHead(404).end('No encontrado.');
    return;
  }
  // En modo fuente, los archivos estáticos públicos viven en public/ pero se sirven desde la raíz web.
  if (!fs.existsSync(resolvedFilePath)) {
    const publicFile = path.resolve(ROOT, 'public', '.' + pathname);
    const publicRelative = path.relative(path.join(ROOT, 'public'), publicFile);
    if (!publicRelative.startsWith('..') && !path.isAbsolute(publicRelative) && fs.existsSync(publicFile)) {
      resolvedFilePath = publicFile;
    }
  }
  fs.readFile(resolvedFilePath, function (error, content) {
    if (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('No se pudo cargar el archivo.'); return; }
    const headers = { 'Content-Type': CONTENT_TYPES[path.extname(resolvedFilePath).toLowerCase()] || 'application/octet-stream' };
    if (['sw.js', 'index.html', 'manifest.json'].includes(path.basename(resolvedFilePath))) headers['Cache-Control'] = 'no-cache';
    if (path.basename(resolvedFilePath) === 'sw.js') headers['Service-Worker-Allowed'] = '/';
    response.writeHead(200, headers).end(content);
  });
});

server.listen(PORT, HOST, function () {
  console.log('Alejandra Space PWA: http://localhost:' + PORT);
  console.log('Sitio servido desde: ' + WEB_ROOT);
  console.log('Base SQLite para mensajes del formulario: data/messages.sqlite');
});

// Cierra la base correctamente cuando se detiene el servidor con Ctrl+C.
process.on('SIGINT', function () {
  database.close();
  server.close(function () { process.exit(0); });
});
