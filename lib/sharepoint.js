import 'server-only';
import { spawn } from 'node:child_process';
import { db } from './db';
import { parseSharePointResponse } from './sharepoint-format.mjs';

const statuses = new Set(['انتشار آگهی', 'در حال بررسی رزومه ها']);
const maxPages = 100;
const refreshInterval = 60_000;
const defaultJobsUrl = 'http://gpasharepoint/sites/hrm/_api/web/lists/getbytitle(%27%D8%AF%D8%B1%D8%AE%D9%88%D8%A7%D8%B3%D8%AA%20%D9%87%D8%A7%DB%8C%20%D8%AC%D8%B0%D8%A8%27)/items?$filter=Status%20eq%20%27%D8%A7%D9%86%D8%AA%D8%B4%D8%A7%D8%B1%20%D8%A2%DA%AF%D9%87%DB%8C%27%20or%20Status%20eq%20%27%D8%AF%D8%B1%20%D8%AD%D8%A7%D9%84%20%D8%A8%D8%B1%D8%B1%D8%B3%DB%8C%20%D8%B1%D8%B2%D9%88%D9%85%D9%87%20%D9%87%D8%A7%27';
let pending;

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function mapSharePointJob(item) {
  const id = Number(item.Id ?? item.ID);
  if (!Number.isSafeInteger(id) || id <= 0 || !clean(item.Title)) throw new Error('Invalid SharePoint job');
  const features = Array.isArray(item.Features) ? item.Features : item.Features?.results;
  return {
    id: -id,
    title: clean(item.Title),
    department: 'فرصت همکاری',
    type: clean(item.WorkType) || 'ثبت نشده',
    experience: clean(item.Career) || 'ثبت نشده',
    salary: clean(item.PayRollRange) || 'توافقی',
    description: clean(item.JobDetail),
    requirements: Array.isArray(features) ? features.filter(value => typeof value === 'string') : [],
    features: Array.isArray(features) ? features.filter(value => typeof value === 'string') : [],
    education: clean(item.Certificate),
    field: clean(item.Field),
    level: clean(item.Level),
    gender: clean(item.Gender),
  };
}

function curlConfigValue(value) {
  if (/[\r\n\0]/.test(value)) throw new Error('Invalid SharePoint configuration');
  return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function request(url, username, password, auth) {
  return new Promise((resolve, reject) => {
    const args = ['--disable', '--silent', '--show-error', '--fail', '--max-time', '20', '--connect-timeout', '5', '--max-filesize', '10485760', '--header', 'Accept: application/json;odata=verbose', '--config', '-'];
    if (auth === 'ntlm') args.push('--ntlm');
    else if (auth === 'negotiate') args.push('--negotiate');
    else if (auth === 'basic') args.push('--basic');
    else return reject(new Error('Unsupported SharePoint authentication'));
    const child = spawn('curl', args, { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
    const chunks = [];
    let size = 0;
    child.stdout.on('data', chunk => {
      size += chunk.length;
      if (size > 10 * 1024 * 1024) child.kill();
      else chunks.push(chunk);
    });
    child.on('error', () => reject(new Error('SharePoint request failed')));
    child.on('close', code => code === 0 && size <= 10 * 1024 * 1024 ? resolve(Buffer.concat(chunks).toString('utf8')) : reject(new Error('SharePoint request failed')));
    child.stdin.on('error', () => {});
    child.stdin.end('url = ' + curlConfigValue(url) + '\nuser = ' + curlConfigValue(username + ':' + password) + '\n');
  });
}

async function fetchJobs() {
  const endpoint = process.env.SHAREPOINT_JOBS_URL || defaultJobsUrl;
  const username = process.env.SHAREPOINT_USERNAME;
  const password = process.env.SHAREPOINT_PASSWORD;
  const auth = process.env.SHAREPOINT_AUTH || 'ntlm';
  if (!endpoint || !username || !password) throw new Error('SharePoint is not configured');
  const base = new URL(endpoint);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Invalid SharePoint URL');
  let url = base.href;
  const jobs = [];
  const seen = new Set();
  for (let page = 0; url && page < maxPages; page++) {
    const next = new URL(url, base);
    if (next.origin !== base.origin || next.pathname !== base.pathname || seen.has(next.href)) throw new Error('Invalid SharePoint pagination');
    seen.add(next.href);
    const { items, next: nextPage } = parseSharePointResponse(await request(next.href, username, password, auth));
    for (const item of items) if (statuses.has(clean(item.Status))) jobs.push(mapSharePointJob(item));
    url = nextPage;
  }
  if (url) throw new Error('Too many SharePoint pages');
  return jobs;
}

function store(jobs) {
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('UPDATE sharepoint_jobs SET active=0').run();
    const upsert = db.prepare('INSERT INTO sharepoint_jobs(id,data,active) VALUES(?,?,1) ON CONFLICT(id) DO UPDATE SET data=excluded.data,active=1');
    for (const job of jobs) upsert.run(job.id, JSON.stringify(job));
    db.prepare("INSERT INTO sharepoint_sync(key,value) VALUES('last_success',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(Date.now()));
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function cachedJobs() {
  return db.prepare('SELECT data FROM sharepoint_jobs WHERE active=1 ORDER BY id ASC').all().map(row => JSON.parse(row.data));
}

export async function getJobs() {
  const last = Number(db.prepare("SELECT value FROM sharepoint_sync WHERE key='last_success'").get()?.value || 0);
  if (Date.now() - last < refreshInterval) return { jobs: cachedJobs(), stale: false };
  if (!pending) pending = fetchJobs().then(store).finally(() => { pending = null; });
  try {
    await pending;
    return { jobs: cachedJobs(), stale: false };
  } catch {
    if (!last) throw new Error('SharePoint is unavailable');
    return { jobs: cachedJobs(), stale: true };
  }
}
