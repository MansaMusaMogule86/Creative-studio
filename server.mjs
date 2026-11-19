import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import * as apiLeads from './dist-api/leads.mjs';

const DIST_DIR = path.resolve('./dist');
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm',
};

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy-Report-Only':
    "default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
};

function cacheHeader(pathname) {
  if (pathname.startsWith('/_astro/')) return 'public, max-age=31536000, immutable';
  if (/^\/(art|brand|renders)\//.test(pathname)) return 'public, max-age=2592000';
  return 'public, max-age=0, must-revalidate';
}

function readBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        reject(new Error('Body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendFile(res, filePath, statusCode, pathname) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': cacheHeader(pathname),
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const host = (req.headers['x-forwarded-host'] || req.headers.host || 'mansasmoguls.com').toString();
    const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
    const url = new URL(req.url || '/', `${proto}://${host}`);

    if (host.toLowerCase().startsWith('www.')) {
      res.writeHead(301, {
        ...SECURITY_HEADERS,
        Location: `https://mansasmoguls.com${url.pathname}${url.search}`,
      });
      res.end();
      return;
    }

    if (url.pathname === '/api/leads' || url.pathname === '/api/leads/') {
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
      }
      const method = (req.method || 'GET').toUpperCase();
      const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);
      const webReq = new Request(url.toString(), { method, headers, body });
      const webRes = method === 'POST' ? await apiLeads.POST(webReq) : await apiLeads.GET(webReq);

      const outHeaders = { ...SECURITY_HEADERS, 'Cache-Control': 'no-store' };
      webRes.headers.forEach((value, key) => {
        outHeaders[key] = value;
      });
      res.writeHead(webRes.status, outHeaders);
      res.end(Buffer.from(await webRes.arrayBuffer()));
      return;
    }

    const decodedPath = decodeURIComponent(url.pathname);
    const safeRel = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
    const candidate = path.join(DIST_DIR, safeRel);

    if (!candidate.startsWith(DIST_DIR)) {
      res.writeHead(403, SECURITY_HEADERS);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      sendFile(res, candidate, 200, url.pathname);
      return;
    }

    const indexCandidate = path.join(candidate, 'index.html');
    if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
      if (!url.pathname.endsWith('/')) {
        res.writeHead(308, { ...SECURITY_HEADERS, Location: `${url.pathname}/${url.search}` });
        res.end();
        return;
      }
      sendFile(res, indexCandidate, 200, url.pathname);
      return;
    }

    const notFound = path.join(DIST_DIR, '404.html');
    if (fs.existsSync(notFound)) {
      sendFile(res, notFound, 404, url.pathname);
      return;
    }

    res.writeHead(404, SECURITY_HEADERS);
    res.end('Not Found');
  } catch (err) {
    console.error('[server error]', err);
    res.writeHead(500, { ...SECURITY_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, code: 'server_error' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`mansasmoguls-web listening on :${PORT}`);
});
