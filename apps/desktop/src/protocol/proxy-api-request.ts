import * as https from 'node:https';
import { DESKTOP_API_BASE_URL } from '../config/constants';

export { DESKTOP_API_BASE_URL };

const API_PREFIX = '/api';

export function toApiUpstreamPath(pathname: string): string | null {
  if (pathname === API_PREFIX || pathname === `${API_PREFIX}/`) {
    return '/';
  }

  if (pathname.startsWith(`${API_PREFIX}/`)) {
    return pathname.slice(API_PREFIX.length);
  }

  return null;
}

export async function proxyApiRequest(
  request: Request,
  socketPath: string,
  upstreamPath: string
): Promise<Response> {
  const url = new URL(request.url);
  const requestPath = `${upstreamPath}${url.search}`;
  const method = request.method ?? 'GET';
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    const headerName = key.toLowerCase();
    if (headerName === 'host' || headerName === 'connection' || headerName === 'content-length') {
      return;
    }
    headers[key] = value;
  });

  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : Buffer.from(await request.arrayBuffer());

  if (body && body.length > 0) {
    headers['content-length'] = String(body.length);
  }

  try {
    return await new Promise<Response>((resolve, reject) => {
      const upstream = https.request(
        {
          socketPath,
          path: requestPath,
          method,
          headers,
          servername: 'localhost',
          rejectUnauthorized: false,
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            const responseHeaders = new Headers();
            for (const [key, value] of Object.entries(response.headers)) {
              if (value === undefined) {
                continue;
              }
              if (Array.isArray(value)) {
                for (const entry of value) {
                  responseHeaders.append(key, entry);
                }
                continue;
              }
              responseHeaders.append(key, value);
            }

            resolve(
              new Response(Buffer.concat(chunks), {
                status: response.statusCode ?? 502,
                headers: responseHeaders,
              })
            );
          });
        }
      );

      upstream.on('error', reject);
      if (body?.length) {
        upstream.write(body);
      }
      upstream.end();
    });
  } catch (error) {
    console.error('[desktop] API proxy failed', { requestPath, error });
    return new Response('API proxy failed', { status: 502 });
  }
}
