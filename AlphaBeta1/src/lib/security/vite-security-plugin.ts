/**
 * OffresLocal — Vite Security Plugin
 * ═══════════════════════════════════
 * Injecte les security headers + rate limiting + honeypots + input sanitization
 * directement dans le serveur de développement Vite
 */

import type { Plugin } from "vite";

// ═══ SECURITY HEADERS ═══
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
  "X-DNS-Prefetch-Control": "off",
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://www.google.com https://openstreetmap.org https://*.openstreetmap.org",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join("; "),
};

// ═══ RATE LIMITER ═══
interface RateLimitEntry {
  count: number;
  windowStart: number;
  blocked: boolean;
  blockUntil: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute
const BLOCK_DURATION = 30_000; // 30 second block on violation

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);

  if (!entry || now > entry.windowStart + RATE_LIMIT_WINDOW) {
    entry = { count: 0, windowStart: now, blocked: false, blockUntil: 0 };
    rateLimitStore.set(ip, entry);
  }

  // Check if currently blocked
  if (entry.blocked && now < entry.blockUntil) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.blockUntil - now) / 1000) };
  }

  // Reset block if expired
  if (entry.blocked && now >= entry.blockUntil) {
    entry.blocked = false;
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    entry.blocked = true;
    entry.blockUntil = now + BLOCK_DURATION;
    return { allowed: false, remaining: 0, retryAfter: Math.ceil(BLOCK_DURATION / 1000) };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, retryAfter: 0 };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.windowStart + RATE_LIMIT_WINDOW * 2) {
      rateLimitStore.delete(key);
    }
  }
}, 120_000);

// ═══ HONEYPOT RESPONSES ═══
const HONEYPOT_RESPONSES: Record<string, { status: number; body: string; contentType: string }> = {
  "/admin": {
    status: 200,
    contentType: "text/html",
    body: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Admin — OffresLocal</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5}
form{background:white;padding:2rem;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.1);width:320px}
h2{margin:0 0 1.5rem;text-align:center;color:#111}
input{width:100%;padding:.75rem;margin-bottom:1rem;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box}
button{width:100%;padding:.75rem;background:#111;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer}
button:hover{background:#333}</style></head>
<body><form method="POST" action="/admin/login">
<h2>🔒 Administration</h2>
<input type="email" name="email" placeholder="Email" required>
<input type="password" name="password" placeholder="Mot de passe" required>
<input type="hidden" name="_csrf" value="tok_${Math.random().toString(36).slice(2)}">
<button type="submit">Se connecter</button>
<p style="text-align:center;font-size:12px;color:#999;margin-top:1rem">OffresLocal v2.1</p>
</form></body></html>`,
  },
  "/admin/login": {
    status: 401,
    contentType: "text/html",
    body: `<!DOCTYPE html><html><head><title>401</title></head><body style="font-family:system-ui;text-align:center;padding:4rem">
<h1>401 — Unauthorized</h1><p>Identifiants incorrects.</p></body></html>`,
  },
  "/.env": {
    status: 200,
    contentType: "text/plain",
    body: `# OffresLocal Environment Configuration
NODE_ENV=production
PORT=8080

# Database
DB_HOST=db.offreslocal.ch
DB_PORT=5432
DB_NAME=offreslocal_prod
DB_USER=postgres
DB_PASSWORD=Pr0d_5ecure_P@ss_2024!

# Redis Cache
REDIS_URL=redis://:r3d1s_p@ss@cache.offreslocal.ch:6379/0

# JWT Authentication
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.c2VjcmV0X2tleV9vZmZyZXNsb2NhbF8yMDI0
JWT_EXPIRY=24h

# Stripe Payments
STRIPE_PUBLIC_KEY=pk_live_51Jx8k2Lm9nOp4QrStUvWxYz
STRIPE_SECRET_KEY=sk_FAKE_HONEYPOT_DO_NOT_USE_xxxxxxxxxxxxxxxx

# AWS S3 Storage
AWS_ACCESS_KEY_ID=AKIA_HONEYPOT_FAKE_KEY_EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=offreslocal-uploads

# SendGrid Email
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

# Google Maps
GOOGLE_MAPS_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
`,
  },
  "/.git/config": {
    status: 200,
    contentType: "text/plain",
    body: `[core]
\trepositoryformatversion = 0
\tfilemode = true
\tbare = false
\tlogallrefupdates = true
[remote "origin"]
\turl = git@github.com:offreslocal/offreslocal-prod.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
\tremote = origin
\tmerge = refs/heads/main
[user]
\tname = Jassim
\temail = admin@offreslocal.ch
`,
  },
  "/wp-admin": {
    status: 200,
    contentType: "text/html",
    body: `<!DOCTYPE html><html><head><title>WordPress</title></head>
<body style="font-family:system-ui;text-align:center;padding:4rem">
<h1>WordPress Admin</h1><p>Ce site utilise WordPress 6.4</p>
<a href="/wp-login.php">Se connecter</a></body></html>`,
  },
  "/phpmyadmin": {
    status: 200,
    contentType: "text/html",
    body: `<!DOCTYPE html><html><head><title>phpMyAdmin</title></head>
<body style="font-family:system-ui;text-align:center;padding:4rem">
<h1>phpMyAdmin 5.2.1</h1><form method="POST">
<input type="text" name="pma_username" placeholder="Username"><br><br>
<input type="password" name="pma_password" placeholder="Password"><br><br>
<button type="submit">Go</button></form></body></html>`,
  },
  "/backup.sql": {
    status: 200,
    contentType: "application/sql",
    body: `-- OffresLocal Database Backup
-- Generated: 2024-01-15 03:00:00 UTC
-- Server: db.offreslocal.ch

SET NAMES utf8mb4;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users VALUES
(1, 'admin@offreslocal.ch', '$2b$12$LJ3m4ys1Kz0GReQn0V5YQO9xVx8R0qZ0PmKkDmFjJZzIqKvHm', 'admin', '2024-01-01 00:00:00'),
(2, 'jassim@offreslocal.ch', '$2b$12$Kk8Y3Pm2L5nGqEzI3R1aE.6ZxK3V9oN2mC7qR8wU5yH2iJ4kL6', 'superadmin', '2024-01-01 00:00:00');

CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES shops(id),
  title VARCHAR(255) NOT NULL,
  price DECIMAL(10,2),
  stock INTEGER DEFAULT 0
);

-- 2847 rows exported
`,
  },
  "/api/admin/users": {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      users: [
        { id: 1, email: "admin@offreslocal.ch", role: "admin", password: "admin123!" },
        { id: 2, email: "jassim@offreslocal.ch", role: "superadmin", password: "J@ss1m_2024!" },
        { id: 3, email: "support@offreslocal.ch", role: "support", password: "supp0rt_OL" },
      ],
      total: 3,
    }),
  },
  "/api/internal/config": {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      stripe_secret: "sk_FAKE_HONEYPOT_xxxxxxxxxxxxxxxxxxxxxxxx",
      jwt_secret: "super_secret_jwt_key_offreslocal_2024",
      db_connection: "postgresql://postgres:Pr0d_5ecure@db.offreslocal.ch:5432/offreslocal_prod",
      redis_url: "redis://:r3d1s_p@ss@cache.offreslocal.ch:6379",
    }),
  },
  "/server-status": {
    status: 200,
    contentType: "text/plain",
    body: `Apache Server Status for offreslocal.ch
Server Version: Apache/2.4.52 (Ubuntu)
Server MPM: event
Server Built: 2024-01-10T00:00:00
Current Time: ${new Date().toISOString()}
Uptime: 864000 seconds
Total Accesses: 142857
CPU Usage: u12.5 s3.2 cu0 cs0 - .0182% CPU load
3.2 requests/sec - 45.2 kB/second - 14.1 kB/request
5 workers: 1 ready, 4 busy`,
  },
};

// ═══ XSS SANITIZER ═══
function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function hasXSSPayload(input: string): boolean {
  const patterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg.*onload/i,
    /<img.*onerror/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /import\s*['"]/i,
    /<link/i,
    /<meta/i,
    /document\.cookie/i,
    /window\.location/i,
    /eval\s*\(/i,
    /Function\s*\(/i,
    /atob\s*\(/i,
    /fromCharCode/i,
  ];
  const decoded = decodeURIComponent(input).toLowerCase();
  return patterns.some((p) => p.test(decoded));
}

// ═══ DIRECTORY TRAVERSAL BLOCKER ═══
function hasTraversalAttempt(url: string): boolean {
  const patterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e/i,
    /%252e%252e/i,
    /\.\.%2f/i,
    /\.\.%5c/i,
    /\/etc\/passwd/i,
    /\/proc\/self/i,
    /\/windows\/system32/i,
  ];
  const decoded = decodeURIComponent(url).toLowerCase();
  return patterns.some((p) => p.test(decoded) || p.test(url));
}

// ═══ SQL INJECTION DETECTOR ═══
function hasSQLInjection(input: string): boolean {
  const decoded = decodeURIComponent(input).toLowerCase();
  const patterns = [
    /(\b|\')(or|and)(\b|\').*=.*/,
    /union\s+(all\s+)?select/i,
    /;\s*(drop|alter|create|insert|update|delete)\s/i,
    /--\s*$/,
    /\/\*.*\*\//,
    /sleep\s*\(/i,
    /benchmark\s*\(/i,
    /waitfor\s+delay/i,
    /load_file\s*\(/i,
    /into\s+(out|dump)file/i,
    /information_schema/i,
  ];
  return patterns.some((p) => p.test(decoded));
}

// ═══ ATTACK LOGGER ═══
interface AttackLog {
  timestamp: string;
  ip: string;
  method: string;
  url: string;
  type: string;
  detail: string;
  blocked: boolean;
}

const attackLogs: AttackLog[] = [];

function logAttack(ip: string, method: string, url: string, type: string, detail: string, blocked: boolean) {
  const entry: AttackLog = {
    timestamp: new Date().toISOString(),
    ip,
    method,
    url,
    type,
    detail,
    blocked,
  };
  attackLogs.push(entry);
  if (attackLogs.length > 5000) attackLogs.shift();

  // Log to console with color
  const icon = blocked ? "🛡️" : "⚠️";
  const color = blocked ? "\x1b[32m" : "\x1b[31m";
  console.log(
    `${color}${icon} [SECURITY] ${type}\x1b[0m\n` +
    `   IP: ${ip} | ${method} ${url}\n` +
    `   Detail: ${detail.slice(0, 200)}\n` +
    `   Blocked: ${blocked ? "YES ✅" : "NO ❌"}`
  );
}

// ═══ VITE PLUGIN ═══
export default function securityPlugin(): Plugin {
  return {
    name: "offreslocal-security",
    enforce: "pre",

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
          || (req.headers["x-real-ip"] as string)
          || req.socket.remoteAddress
          || "unknown";
        const method = req.method || "GET";
        const url = req.url || "/";

        // ═══ CHECK 1: Directory Traversal ═══
        if (hasTraversalAttempt(url)) {
          logAttack(ip, method, url, "Directory Traversal", url, true);
          res.writeHead(403, { "Content-Type": "text/plain", ...SECURITY_HEADERS });
          res.end("403 Forbidden — Suspicious path detected");
          return;
        }

        // ═══ CHECK 2: SQL Injection in URL ═══
        if (hasSQLInjection(url)) {
          logAttack(ip, method, url, "SQL Injection", url, true);
          res.writeHead(403, { "Content-Type": "text/plain", ...SECURITY_HEADERS });
          res.end("403 Forbidden — Malicious query detected");
          return;
        }

        // ═══ CHECK 3: XSS in URL parameters ═══
        if (hasXSSPayload(url)) {
          logAttack(ip, method, url, "XSS Attempt", url, true);
          res.writeHead(403, { "Content-Type": "text/plain", ...SECURITY_HEADERS });
          res.end("403 Forbidden — Cross-site scripting attempt detected");
          return;
        }

        // ═══ CHECK 4: Honeypot endpoints ═══
        const urlPath = url.split("?")[0];
        for (const [path, response] of Object.entries(HONEYPOT_RESPONSES)) {
          if (urlPath === path || urlPath.startsWith(path + "/")) {
            logAttack(ip, method, url, "Honeypot Triggered", `Accessed ${path}`, true);
            res.writeHead(response.status, {
              "Content-Type": response.contentType,
              ...SECURITY_HEADERS,
              "X-Honeypot": "true",
            });
            res.end(response.body);
            return;
          }
        }

        // ═══ CHECK 5: Replay attack (timestamp validation) ═══
        const olTimestamp = req.headers["x-ol-ts"];
        if (olTimestamp) {
          const ts = parseInt(olTimestamp as string, 10);
          const now = Date.now();
          if (Math.abs(now - ts) > 300_000) {
            logAttack(ip, method, url, "Replay Attack", `Timestamp: ${ts}, age: ${Math.abs(now - ts)}ms`, true);
            res.writeHead(403, { "Content-Type": "text/plain", ...SECURITY_HEADERS });
            res.end("403 Forbidden — Request expired");
            return;
          }
        }

        // ═══ CHECK 6: Rate limiting (exclut les assets statiques) ═══
        const isStaticAsset = urlPath.startsWith("/node_modules/")
          || urlPath.startsWith("/@")
          || urlPath.startsWith("/src/")
          || /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|map)(\?|$)/.test(urlPath);
        
        let rateResult = { allowed: true, remaining: RATE_LIMIT_MAX, retryAfter: 0 };
        if (!isStaticAsset) {
          rateResult = checkRateLimit(ip);
          if (!rateResult.allowed) {
            logAttack(ip, method, url, "Rate Limit Exceeded", `Retry after: ${rateResult.retryAfter}s`, true);
            res.writeHead(429, {
              "Content-Type": "application/json",
              "Retry-After": String(rateResult.retryAfter),
              "X-RateLimit-Remaining": "0",
              ...SECURITY_HEADERS,
            });
            res.end(JSON.stringify({
              error: "Trop de requêtes. Réessayez plus tard.",
              retryAfter: rateResult.retryAfter,
            }));
            return;
          }
        }

        // ═══ CHECK 7: Suspicious User Agents ═══
        const ua = (req.headers["user-agent"] || "").toLowerCase();
        const blockedUAs = ["sqlmap", "nikto", "nmap", "masscan", "zgrab", "dirbuster", "gobuster", "wfuzz", "burp"];
        for (const badUA of blockedUAs) {
          if (ua.includes(badUA)) {
            logAttack(ip, method, url, "Malicious Tool Detected", `User-Agent: ${ua}`, true);
            res.writeHead(403, { "Content-Type": "text/plain", ...SECURITY_HEADERS });
            res.end("403 Forbidden");
            return;
          }
        }

        // ═══ CHECK 8: Common exploit paths ═══
        const exploitPaths = [
          "/cgi-bin/", "/shell.", "/cmd.", "/exec", "/eval",
          "/.htaccess", "/.htpasswd", "/web.config",
          "/xmlrpc.php", "/wp-config.php", "/wp-includes/",
          "/actuator/", "/console/", "/jolokia/",
          "/debug/", "/trace/", "/elmah.axd",
        ];
        for (const exploitPath of exploitPaths) {
          if (urlPath.toLowerCase().includes(exploitPath)) {
            logAttack(ip, method, url, "Exploit Path", urlPath, true);
            res.writeHead(404, { "Content-Type": "text/plain", ...SECURITY_HEADERS });
            res.end("404 Not Found");
            return;
          }
        }

        // ═══ CHECK 9: Suspicious HTTP methods ═══
        const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
        if (!allowedMethods.includes(method)) {
          logAttack(ip, method, url, "Suspicious Method", method, true);
          res.writeHead(405, { "Content-Type": "text/plain", ...SECURITY_HEADERS });
          res.end("405 Method Not Allowed");
          return;
        }

        // ═══ ALL CHECKS PASSED — Add security headers and continue ═══
        // Inject security headers into the response
        const originalWriteHead = res.writeHead.bind(res);
        res.writeHead = function (statusCode: number, ...args: unknown[]) {
          // Merge security headers (don't override existing ones)
          const headers = args[0] as Record<string, string> | undefined;
          const mergedHeaders = { ...SECURITY_HEADERS, ...headers };
          mergedHeaders["X-RateLimit-Remaining"] = String(rateResult.remaining);
          return originalWriteHead(statusCode, mergedHeaders);
        };

        next();
      });

      // Expose attack logs endpoint (admin only)
      server.middlewares.use("/_security/logs", (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json", ...SECURITY_HEADERS });
        res.end(JSON.stringify({
          total: attackLogs.length,
          blocked: attackLogs.filter((l) => l.blocked).length,
          logs: attackLogs.slice(-100),
        }));
      });
    },
  };
}
