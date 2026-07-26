// Gera JWT keys para Supabase self-hosted
// Uso: node generate-keys.js
const crypto = require("crypto");

// Gera JWT_SECRET aleatório
const jwtSecret = crypto.randomBytes(32).toString("hex");
console.log(`JWT_SECRET=${jwtSecret}\n`);

// Cria payloads para ANON_KEY e SERVICE_ROLE_KEY
const anonPayload = {
  role: "anon",
  iss: "supabase",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 315360000, // +10 anos
};

const servicePayload = {
  role: "service_role",
  iss: "supabase",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 315360000,
};

// Base64 URL-safe encode
function b64url(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// HMAC-SHA256 sign
function sign(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const data = `${b64url(header)}.${b64url(payload)}`;
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("base64");
  const sig = hmac.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${sig}`;
}

console.log(`ANON_KEY=${sign(anonPayload, jwtSecret)}`);
console.log(`SERVICE_ROLE_KEY=${sign(servicePayload, jwtSecret)}`);
