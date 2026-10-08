// ============================================================================
// JOHAR PLATFORM — NETLIFY API FUNCTION
// ============================================================================
// يغلّف تطبيق Express بالكامل داخل Netlify Function واحدة
// كل الطلبات الموجهة إلى /api/* تصل هنا وتُمرر إلى Express

import serverless from 'serverless-http';
import app from '../../src/app';

const handler = serverless(app);

// Netlify Functions v1 (CommonJS-style export)
exports.handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // Strip the Netlify function prefix so Express sees clean paths.
  // Netlify raw path: /.netlify/functions/api/<rest>
  // Express should see: /<rest>
  const FUNC_PREFIX = '/.netlify/functions/api';
  if (event.path && event.path.startsWith(FUNC_PREFIX)) {
    const stripped = event.path.slice(FUNC_PREFIX.length) || '/';
    event.path = stripped;
  }
  // serverless-http prefers rawUrl when present — rewrite it too
  if (event.rawUrl && typeof event.rawUrl === 'string') {
    const idx = event.rawUrl.indexOf(FUNC_PREFIX);
    if (idx !== -1) {
      const after = event.rawUrl.slice(idx + FUNC_PREFIX.length) || '/';
      const origin = event.rawUrl.slice(0, idx);
      event.rawUrl = origin + after;
    }
  }
  if (event.rawPath && typeof event.rawPath === 'string' && event.rawPath.startsWith(FUNC_PREFIX)) {
    event.rawPath = event.rawPath.slice(FUNC_PREFIX.length) || '/';
  }
  if (event.resource && typeof event.resource === 'string' && event.resource.startsWith(FUNC_PREFIX)) {
    event.resource = event.resource.slice(FUNC_PREFIX.length) || '/';
  }

  return handler(event, context);
};