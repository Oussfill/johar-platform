// ============================================================================
// JOHAR — API-FIRST REST CONTRACT (§24)
// ============================================================================
// مواصفة OpenAPI 3.0 حيّة مبنية من شجرة المسارات الفعلية في Express، كل نقطة
// تحمل وسم التفويض (permission) والسياق (scope) والمخاطر من سجل الصلاحيات.
// تنشر: GET /api/v1/openapi.json  (المواصفة)  ·  GET /api/v1/docs  (توثيق HTML)
// البناء: introspection على app._router → لا توزيعات مزدوجة بين الكود والوثيقة.

import type { Express } from 'express';
import { PERMISSION_MAP } from '../authorization/PermissionRegistry';
import { ORG_ROLE_PERMISSIONS } from '../authorization/PermissionRegistry';

const API_PREFIX = '/api/v1';
const GENERATED_AT = () => new Date().toISOString();

interface OpMeta {
  permission?: string;
  scope?: string;
}

// خريطة التفويض الدقيقة للعائلات الجديدة (منسجمة مع ملفات المسارات)
const OPS_META: Record<string, OpMeta> = {
  'POST /orgs': { permission: 'organization:create', scope: 'own' },
  'GET /orgs': {},
  'PATCH /orgs/:orgId': { permission: 'organization:update', scope: 'org' },
  'GET /orgs/:orgId/members': { permission: 'organization:read', scope: 'org' },
  'POST /orgs/:orgId/team': { permission: 'team:assignrole', scope: 'org' },
  'POST /orgs/:orgId/switch': {},
  'POST /orgs/:orgId/kyb': { permission: 'organization:update', scope: 'org' },
  'POST /orgs/:orgId/kyb/approve': { permission: 'kyb:approve', scope: 'platform' },

  'GET /trust/status': { permission: 'trust:view', scope: 'org' },
  'POST /trust/apply': { permission: 'trust:apply', scope: 'org' },
  'GET /trust/entitlements/trusted-network': { permission: 'supplier:trustedNetwork', scope: 'org' },
  'GET /trust/entitlements/premium-certified': { permission: 'product:premiumCertified', scope: 'org' },
  'POST /trust/:orgId/factors/:factor/approve': { permission: 'trust:evaluate', scope: 'platform' },
  'POST /trust/:orgId/factors/:factor/reject': { permission: 'trust:evaluate', scope: 'platform' },

  'POST /erp/suppliers': { permission: 'supplier:create', scope: 'org' },
  'GET /erp/suppliers': { permission: 'supplier:read', scope: 'org' },
  'GET /erp/suppliers/:id': { permission: 'supplier:read', scope: 'org' },
  'PATCH /erp/suppliers/:id': { permission: 'supplier:update', scope: 'org' },
  'POST /erp/suppliers/:id/evaluate': { permission: 'supplier:evaluate', scope: 'org' },
  'POST /erp/crm/customers': { permission: 'crm:create', scope: 'org' },
  'GET /erp/crm/customers': { permission: 'crm:view', scope: 'org' },
  'POST /erp/crm/interactions': { permission: 'crm:update', scope: 'org' },
  'POST /erp/crm/opportunities': { permission: 'crm:create', scope: 'org' },
  'GET /erp/crm/opportunities': { permission: 'crm:view', scope: 'org' },
  'PATCH /erp/crm/opportunities/:id': { permission: 'crm:update', scope: 'org' },
  'POST /erp/procurement/purchase-requests': { permission: 'purchase:request', scope: 'org' },
  'GET /erp/procurement/purchase-requests': { permission: 'purchase:request', scope: 'org' },
  'POST /erp/procurement/purchase-requests/:id/submit': { permission: 'purchase:request', scope: 'org' },
  'POST /erp/procurement/purchase-requests/:id/approve': { permission: 'purchase:approve', scope: 'org' },
  'POST /erp/procurement/rfqs': { permission: 'rfq:create', scope: 'org' },
  'GET /erp/procurement/rfqs': { permission: 'rfq:read', scope: 'org' },
  'POST /erp/procurement/rfqs/:id/send': { permission: 'rfq:create', scope: 'org' },
  'POST /erp/procurement/rfqs/:id/offers': { permission: 'rfq:create', scope: 'org' },
  'POST /erp/procurement/rfqs/:id/choose/:offerId': { permission: 'rfq:choose', scope: 'org' },
  'POST /erp/procurement/purchase-orders': { permission: 'purchase:order', scope: 'org' },
  'GET /erp/procurement/purchase-orders': { permission: 'purchase:read', scope: 'org' },
  'POST /erp/procurement/purchase-orders/:id/receive': { permission: 'purchase:receive', scope: 'org' },
  'POST /erp/procurement/goods-receipts/:id/inspect': { permission: 'purchase:receive', scope: 'org' },
  'POST /erp/sales/orders': { permission: 'order:create', scope: 'org' },
  'GET /erp/sales/orders': { permission: 'order:read', scope: 'org' },
  'POST /erp/sales/orders/:id/verify': { permission: 'order:update', scope: 'org' },
  'POST /erp/sales/orders/:id/fulfill': { permission: 'order:fulfill', scope: 'org' },
  'POST /erp/sales/invoices': { permission: 'finance:invoice:create', scope: 'org' },
  'GET /erp/sales/invoices': { permission: 'finance:invoice:read', scope: 'org' },
  'POST /erp/sales/invoices/:id/pay': { permission: 'finance:invoice:create', scope: 'org' },

  'GET /ai/results': { permission: 'compliance:review', scope: 'platform' },
  'GET /ai/results/:id': { permission: 'compliance:review', scope: 'platform' },
  'POST /ai/results/:id/review': { permission: 'compliance:review', scope: 'platform' },
  'GET /ai/fraud': { permission: 'compliance:review', scope: 'platform' },
  'POST /ai/fraud/:id/review': { permission: 'compliance:review', scope: 'platform' },

  'GET /audit/export/siem': { permission: 'audit:export', scope: 'platform' },

  'GET /stats/vaa': { permission: 'audit:read', scope: 'platform' },
};

// مسارات عامة (لا تتطلب JWT) — قائمة معروفة/موثقة
const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  'GET /health',
  'POST /auth/login',
  'POST /auth/register',
  'POST /auth/google',
  'GET /assets/verify/:passport_id',
  'GET /assets/gold/:gold_id',
  'POST /newsletter/subscribe',
  'GET /articles',
  'GET /exhibitors',
  'POST /buyer-program',
  'POST /contact/inquiry',
]);

const DEFAULT_RESPONSES = {
  200: { description: 'نجاح — غلاف قياسي { success, data }' },
  400: { description: 'طلب غير صالح — error.code من قائمة الأكواد' },
  401: { description: 'مصادقة ناقصة أو رمز منتهي' },
  403: { description: 'ممنوع — لا يملك السياق الصلاحية (منهج ABAC)' },
  404: { description: 'المسار/المورد غير موجود' },
  409: { description: 'تعارض حالة أو SoD (مثلاً verify بعد fulfill)' },
  428: { description: 'متطلب مسبق غير محقق — بوابة Tier/تحقق' },
  429: { description: 'تجاوز حد المعدل' },
  500: { description: 'خطأ داخلي' },
} as const;

interface PathEntry {
  methods: string[];
  originalPath: string;
}

const TAG_MAP: Record<string, string> = {
  '/api/v1/auth': 'AUTH',
  '/api/v1/assets': 'ASSETS',
  '/api/v1/ai': 'AI',
  '/api/v1/custody': 'CUSTODY',
  '/api/v1/erp': 'ERP',
  '/api/v1/audit': 'AUDIT',
  '/api/v1/vaults': 'VAULTS',
  '/api/v1/marketplace': 'MARKETPLACE',
  '/api/v1/hr': 'HR',
  '/api/v1/financial': 'FINANCIAL',
  '/api/v1/assay': 'ASSAY',
  '/api/v1/digital-identity': 'DIGITAL-IDENTITY',
  '/api/v1/compliance': 'COMPLIANCE',
  '/api/v1/system': 'SYSTEM',
  '/api/v1/ownership': 'OWNERSHIP',
  '/api/v1/logistics': 'LOGISTICS',
  '/api/v1/contact': 'CONTACT',
  '/api/v1/admin': 'ADMIN',
  '/api/v1/admin/content': 'B2B-ADMIN',
  '/api/v1': 'B2B',
  '/api/v1/public': 'PUBLIC',
  '/api/v1/stats': 'STATS',
};
const TAG_KEYS = Object.keys(TAG_MAP).sort((a, b) => b.length - a.length);

function extractMountFromLayer(layer: any): string | null {
  const src: string | undefined = layer.regexp && layer.regexp.source;
  if (!src) return null;
  // Express 4 static mount regex: ^\/path\/?(?=\/|$)
  // Replace '\/' → '/' then truncate before first '?(' or '\\?('
  let s = src.replace(/^\^/, '').replace(/\\\//g, '/');
  const idx = s.indexOf('?(');
  if (idx > 0) s = s.slice(0, idx);
  s = s.replace(/\/$/, '');
  return s || null;
}

function introspectRoutes(app: Express): Map<string, PathEntry> {
  const inventory = new Map<string, { methods: Set<string>; original: string }>();

  const walk = (stack: any[], prefix: string): void => {
    for (const layer of stack) {
      if (!layer) continue;
      if (layer.route) {
        const route = layer.route as { path: string; methods: Record<string, boolean> };
        let full = (prefix + route.path).replace(/\/+/g, '/');
        if (full.length > 1 && full.endsWith('/')) full = full.slice(0, -1);
        for (const method of Object.keys(route.methods)) {
          if (method === '_all') continue;
          const key = full.toLowerCase();
          if (!inventory.has(key)) inventory.set(key, { methods: new Set(), original: full });
          inventory.get(key)!.methods.add(method.toUpperCase());
        }
      } else if (layer.handle && Array.isArray(layer.handle.stack)) {
        const mount = extractMountFromLayer(layer) || '';
        walk(layer.handle.stack, prefix + mount);
      }
    }
  };

  walk((app as any)._router.stack, '');
  const out = new Map<string, PathEntry>();
  for (const [key, v] of inventory) {
    out.set(key, { methods: [...v.methods].sort(), originalPath: v.original });
  }
  return out;
}

function toOpenApiPath(expressPath: string): string {
  const rel = expressPath.startsWith(API_PREFIX)
    ? expressPath.slice(API_PREFIX.length)
    : expressPath;
  const cleaned = rel.startsWith('/') ? rel : `/${rel}`;
  const human = cleaned === '/' ? '' : cleaned;
  return human.replace(/:[^/]+/g, (m) => `{${m.slice(1)}}`);
}

function permissionMeta(code: string | undefined) {
  if (!code) return null;
  const def = PERMISSION_MAP.get(code);
  if (!def) return { code, source: 'curated' };
  return {
    code,
    module: def.module,
    minTier: def.minTier,
    risk: def.risk,
    sensitive: def.sensitive,
  };
}

function tagFor(fullPath: string): string {
  for (const prefix of TAG_KEYS) {
    if (fullPath === prefix || fullPath.startsWith(prefix + '/')) return TAG_MAP[prefix];
  }
  const seg = fullPath.split('/').filter(Boolean)[0];
  return seg ? seg.toUpperCase() : 'ROOT';
}

function opKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path.startsWith(API_PREFIX) ? path.slice(API_PREFIX.length) : path}`;
}

export function buildOpenApiSpec(app: Express) {
  const inventory = introspectRoutes(app);
  const specPaths: Record<string, any> = {};
  const tagCounts: Record<string, number> = {};

  for (const [path, { methods, originalPath }] of inventory) {
    const openPath = toOpenApiPath(originalPath);
    const pathItem: Record<string, any> = {};
    for (const method of methods) {
      const low = method.toLowerCase();
      const key = opKey(method, originalPath);
      const meta = OPS_META[key];
      const isPublic = PUBLIC_PATHS.has(key) || originalPath.startsWith(`${API_PREFIX}/public`) || key === 'GET /health';
      const permission = permissionMeta(meta?.permission);
      const tag = tagFor(originalPath);
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;

      pathItem[low] = {
        tags: [tag],
        summary: meta?.permission
          ? `${meta.permission} (نطاق ${meta.scope})`
          : isPublic
            ? 'نقطة عامة'
            : 'محميّة (مصادقة JWT — نطاق السياق)',
        security: isPublic ? [] : [{ bearerAuth: [] }],
        'x-johar': {
          permission: permission ?? (isPublic ? { code: 'public' } : { code: 'authenticated (unmapped)' }),
          scope: meta?.scope,
          originalPath,
          secured: !isPublic,
        },
        parameters: (openPath.match(/\{([^}]+)\}/g) || []).map((p) => ({
          name: p.slice(1, -1),
          in: 'path',
          required: true,
          schema: { type: 'string' },
        })),
        responses: { ...DEFAULT_RESPONSES },
      };
    }
    specPaths[openPath || '/'] = pathItem;
  }

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return {
    openapi: '3.0.3',
    info: {
      title: 'JOHAR Platform API — REST Contract',
      version: '1.0.0',
      description:
        'العقد الرسمي لواجهة JOHAR (§24 من JOHAR-MasterArchitecture-v1). كل نقطة تحمل وسم x-johar.permission المسند من سجل الصلاحيات، ووسم x-johar.secured لتحديد الحماية. المسارات عامة أو محمية بـ JWT (Bearer).',
    },
    servers: [{ url: API_PREFIX, description: 'Netlify Functions — نقاط /api/v1' }],
    tags: sortedTags.map(([name, count]) => ({ name, description: `مجموعة ${name}: ${count} نقطة` })),
    paths: specPaths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Envelope: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {},
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
          required: ['success'],
        },
        ErrorCode: {
          type: 'string',
          enum: [
            'VALIDATION_ERROR',
            'UNAUTHORIZED',
            'FORBIDDEN',
            'NOT_FOUND',
            'SOD_CONFLICT',
            'PRECONDITION_FAILED',
            'RATE_LIMIT_EXCEEDED',
            'INTERNAL_ERROR',
          ],
        },
      },
    },
    'x-johar-meta': {
      endpointCount: Object.keys(specPaths).reduce((n, p) => n + Object.keys(specPaths[p]).length, 0),
      standardLevels: '§12 — levels 0..6 عبر VerificationLevel + Organization.trustLevel',
      reference: `${API_PREFIX}/openapi.json`,
      docs: `${API_PREFIX}/docs`,
      generatedAt: GENERATED_AT(),
      orgGrantablePermissions: Object.values(ORG_ROLE_PERMISSIONS),
    },
  };
}

function renderDocsHTML(spec: any): string {
  const endpointCount = (spec['x-johar-meta'] as any).endpointCount;
  const tagRows = spec.tags.map((t: any) => {
    const paths = Object.entries(spec.paths).filter(([, pi]: any) =>
      Object.values(pi).some((op: any) => Array.isArray(op.tags) && op.tags[0] === t.name),
    );
    const ops = paths.map(([p, pi]: any) =>
      Object.entries(pi)
        .filter(([m]) => ['get', 'post', 'put', 'patch', 'delete'].includes(m))
        .map(([m, op]: any) => {
          const j = op['x-johar'] || {};
          const perm = j.permission || {};
          const badge = perm.code === 'public' ? 'public' : perm.code;
          const scope = j.scope ? ` · ${j.scope}` : '';
          const tier = perm.minTier ? ` · Tier≥${perm.minTier}` : '';
          const risk = perm.risk ? ` · ${perm.risk}` : '';
          const crud = ['get', 'post', 'put', 'patch', 'delete'].includes(m) ? m.toUpperCase() : m;
          return `
<details class="op">
  <summary>
    <span class="m m-${crud.toLowerCase()}">${crud}</span>
    <code class="path">${p === '' ? '/' : p}</code>
    <code class="badge">${badge}${scope}${tier}${risk}</code>
    ${op.summary ? `<span class="sum">${op.summary}</span>` : ''}
  </summary>
  <div class="opbody">
    <p><strong>المسار الأصلي:</strong> <code>${j.originalPath}</code></p>
    <p><strong>الحماية:</strong> ${j.secured ? 'JWT Bearer' : 'عام (بلا مصادقة)'}</p>
    ${op.parameters && op.parameters.length ? `<p><strong>معاملات المسار:</strong> ${op.parameters.map((x: any) => `<code>{${x.name}}</code>`).join(' ')}</p>` : ''}
    <p><strong>الاستجابات المحتملة:</strong> ${Object.keys(op.responses).join(' · ')}</p>
  </div>
</details>`;
        })
        .join(''),
    ).join('');
    return `<section class="tag"><h2>${t.name} <small>${t.description}</small></h2>${ops}</section>`;
  }).join('');

  const permHtml = Object.entries(spec['x-johar-meta'].orgGrantablePermissions).length
    ? ''
    : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>JOHAR API — REST Contract (§24)</title>
<style>
:root{--gold:#c9a227;--bg:#0e1016;--card:#171b26;--line:#262c3b;--txt:#e8e6df;--dim:#9aa3b5;}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--txt);font-family:"Segoe UI",Tahoma,sans-serif;line-height:1.6}
.wrap{max-width:980px;margin:0 auto;padding:28px 20px 80px}
h1{color:var(--gold);margin-bottom:2px}
.sub{color:var(--dim)}
.meta{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 26px}
.pill{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:3px 12px;font-size:13px;color:var(--dim)}
.tag{border:1px solid var(--line);border-radius:10px;background:var(--card);padding:14px 16px;margin-bottom:14px}
.tag h2{margin:0 0 10px;font-size:16px;color:var(--gold);display:flex;justify-content:space-between;align-items:baseline}
.tag h2 small{color:var(--dim);font-weight:normal;font-size:12px}
.op{background:#10131c;border:1px solid var(--line);border-radius:8px;margin-bottom:6px;padding:0}
.op summary{cursor:pointer;list-style:none;display:flex;gap:10px;align-items:center;padding:8px 12px;flex-wrap:wrap}
.op summary::-webkit-details-marker{display:none}
.op[open]{border-color:var(--gold)}
.m{font-family:Consolas,monospace;font-size:11px;font-weight:bold;border-radius:4px;padding:2px 7px;color:#0e1016}
.m-get{background:#61c26a}.m-post{background:#e0a93c}.m-put{background:#5596d8}.m-patch{background:#b07fd8}.m-delete{background:#d86161}
.path{font-family:Consolas,monospace;color:var(--txt)}
.badge{font-family:Consolas,monospace;font-size:11px;background:#20283a;border-radius:4px;padding:2px 7px;color:var(--gold)}
.sum{color:var(--dim);font-size:12px}
.opbody{padding:4px 12px 12px;color:var(--dim);font-size:13px;border-top:1px dashed var(--line)}
.opbody code{background:#20283a;padding:1px 6px;border-radius:4px;color:#d7e3a3}
a{color:#8fb3e8}
</style>
</head>
<body>
<div class="wrap">
<h1>JOHAR Platform API</h1>
<div class="sub">العقد الرسمي · مصدر واحد للحقيقة (من شجرة مسارات Express) · MasterArchitecture §24</div>
<div class="meta">
<span class="pill">${endpointCount} نقطة</span>
<span class="pill">OpenAPI 3.0.3</span>
<span class="pill">${spec.servers[0].url}</span>
<span class="pill">المسارات: <a href="${spec['x-johar-meta'].reference}">openapi.json</a> · <a href="${spec['x-johar-meta'].docs}">هذه الصفحة</a></span>
<span class="pill">التوليد: ${spec['x-johar-meta'].generatedAt}</span>
</div>
${tagRows}
</div>
</body>
</html>`;
}

export function initOpenApi(app: Express): void {
  let cache: { spec: any; html: string } | null = null;
  const specOf = () => {
    if (!cache) {
      const spec = buildOpenApiSpec(app);
      cache = {
        spec,
        html: renderDocsHTML(spec),
      };
    }
    return cache;
  };

  app.get(`${API_PREFIX}/openapi.json`, (_req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(specOf().spec);
  });

  app.get(`${API_PREFIX}/docs`, (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(specOf().html);
  });
}