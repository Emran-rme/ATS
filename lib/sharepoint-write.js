import 'server-only';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function configValue(value) {
  if (/[\r\n\0]/.test(value)) throw new Error('Invalid SharePoint configuration');
  return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

export function sharePointSite() {
  const site = new URL(process.env.SHAREPOINT_SITE_URL || 'http://gpasharepoint/sites/hrm');
  if (!['http:', 'https:'].includes(site.protocol) || site.username || site.password || site.search || site.hash) throw new Error('Invalid SharePoint site');
  return site.href.replace(/\/$/, '');
}

export async function sharePointRequest(relative, { method = 'GET', body, headers = {} } = {}) {
  const username = process.env.SHAREPOINT_USERNAME;
  const password = process.env.SHAREPOINT_PASSWORD;
  const auth = process.env.SHAREPOINT_AUTH || 'ntlm';
  if (!username || !password || !['ntlm', 'negotiate', 'basic'].includes(auth)) throw new Error('SharePoint is not configured');
  const site = sharePointSite();
  const target = new URL(relative, site + '/');
  if (target.origin !== new URL(site).origin || !target.pathname.startsWith(new URL(site).pathname.replace(/\/$/, '') + '/_api/')) throw new Error('Invalid SharePoint request');
  let temporary;
  try {
    const args = ['--disable', '--silent', '--show-error', '--max-time', '30', '--connect-timeout', '5', '--max-filesize', '10485760', '--' + auth, '--request', method, '--header', 'Accept: application/json;odata=verbose', '--write-out', '\n%{http_code}', '--config', '-'];
    for (const [name, value] of Object.entries(headers)) args.push('--header', name + ': ' + value);
    if (body !== undefined) {
      temporary = await mkdtemp(path.join(os.tmpdir(), 'ats-sp-'));
      const file = path.join(temporary, 'body');
      await writeFile(file, body, { mode: 0o600 });
      args.push('--data-binary', '@' + file);
    }
    const output = await new Promise((resolve, reject) => {
      const child = spawn('curl', args, { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
      const chunks = [];
      let size = 0;
      child.stdout.on('data', chunk => { size += chunk.length; if (size > 10 * 1024 * 1024) child.kill(); else chunks.push(chunk); });
      child.on('error', () => reject(new Error('SharePoint request failed')));
      child.on('close', code => code === 0 && size <= 10 * 1024 * 1024 ? resolve(Buffer.concat(chunks).toString('utf8')) : reject(new Error('SharePoint request failed')));
      child.stdin.on('error', () => {});
      child.stdin.end('url = ' + configValue(target.href) + '\nuser = ' + configValue(username + ':' + password) + '\n');
    });
    const separator = output.lastIndexOf('\n');
    const status = Number(output.slice(separator + 1));
    if (!Number.isInteger(status)) throw new Error('Invalid SharePoint response');
    const response = output.slice(0, separator);
    if (status < 200 || status >= 300) {
      const error = new Error('SharePoint request failed');
      error.status = status;
      throw error;
    }
    return response ? JSON.parse(response) : {};
  } finally {
    if (temporary) await rm(temporary, { recursive: true, force: true });
  }
}

export async function sharePointDigest() {
  const response = await sharePointRequest('_api/contextinfo', { method: 'POST', headers: { 'Content-Length': '0' } });
  const digest = response.d?.GetContextWebInformation?.FormDigestValue;
  if (!digest) throw new Error('Invalid SharePoint digest');
  return digest;
}

export async function sharePointWrite(relative, data, digest, merge = false) {
  return sharePointRequest(relative, { method: 'POST', body: Buffer.from(JSON.stringify(data)), headers: { 'Content-Type': 'application/json;odata=verbose', 'X-RequestDigest': digest, ...(merge ? { 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*' } : {}) } });
}
