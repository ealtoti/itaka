/* Ikatá · Worker do site
   - serve os arquivos de public/ (binding ASSETS)
   - redireciona www.ikata.pro para ikata.pro
   - recebe o formulário em POST /api/contato e grava no D1 (binding DB)
   - aplica cabeçalhos de segurança em todas as respostas */

const CANONICAL_HOST = 'ikata.pro';
const PERFIS = new Set(['marca', 'agencia', 'creator']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY = 10_000;

const CSP = [
  "default-src 'self'",
  // hash do script inline que marca <html class="js">
  "script-src 'self' 'sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw='",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'"
].join('; ');

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

function withSecurityHeaders(response) {
  const res = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  return res;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function handleContato(request, env) {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // Só aceita envios feitos a partir do próprio site
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ ok: false, error: 'too_large' }, 413);

  let data;
  try { data = JSON.parse(raw); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }

  // Campo-armadilha preenchido: responde ok e descarta
  if (clean(data.site, 200)) return json({ ok: true });

  const contato = {
    nome: clean(data.nome, 120),
    empresa: clean(data.empresa, 160),
    email: clean(data.email, 200).toLowerCase(),
    perfil: clean(data.perfil, 20),
    mensagem: clean(data.mensagem, 4000),
    idioma: data.idioma === 'en' ? 'en' : 'pt'
  };

  const erros = [];
  if (!contato.nome) erros.push('nome');
  if (!EMAIL_RE.test(contato.email)) erros.push('email');
  if (!PERFIS.has(contato.perfil)) erros.push('perfil');
  if (data.consentimento !== true) erros.push('consentimento');
  if (erros.length) return json({ ok: false, error: 'invalid', fields: erros }, 422);

  await env.DB.prepare(
    'INSERT INTO contatos (nome, empresa, email, perfil, mensagem, idioma, consentimento) VALUES (?, ?, ?, ?, ?, ?, 1)'
  ).bind(
    contato.nome,
    contato.empresa || null,
    contato.email,
    contato.perfil,
    contato.mensagem || null,
    contato.idioma
  ).run();

  return json({ ok: true }, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === 'www.' + CANONICAL_HOST) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/contato') {
      try {
        return withSecurityHeaders(await handleContato(request, env));
      } catch (err) {
        console.error('contato', err);
        return withSecurityHeaders(json({ ok: false, error: 'server_error' }, 500));
      }
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  }
};
