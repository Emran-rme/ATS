import 'server-only';
import { db } from './db';
import { sharePointDigest, sharePointRequest, sharePointWrite } from './sharepoint-write';

const profiles = "_api/web/lists(guid'49c76ff5-fd43-4871-b6f1-9d04fd644a9a')";
let running = false;

function identifier(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Invalid SharePoint identifier');
  return number;
}

function odata(value) {
  return String(value).replace(/'/g, "''");
}

async function findOrCreateProfile(userId, payload, digest) {
  const existing = db.prepare('SELECT profile_id FROM sharepoint_profiles WHERE user_id=?').get(userId);
  if (existing) return identifier(existing.profile_id);
  if (db.prepare('SELECT 1 FROM sharepoint_profile_creation WHERE user_id=?').get(userId)) throw new Error('Profile creation requires reconciliation');
  const byEmail = new URLSearchParams({ '$select': 'Id', '$filter': "Email eq '" + odata(payload.email) + "'", '$top': '1' });
  const prior = await sharePointRequest(profiles + '/items?' + byEmail);
  if (!Array.isArray(prior.d?.results) || prior.d.results.length) throw new Error('Existing profile requires reconciliation');
  db.prepare('INSERT INTO sharepoint_profile_creation(user_id) VALUES(?)').run(userId);
  const created = await sharePointWrite(profiles + '/items', { __metadata: { type: 'SP.Data.CandidateProfileListItem' }, Title: String(payload.jobId), CandidateName: payload.name, Email: payload.email }, digest);
  const profileId = identifier(created.d?.Id);
  db.prepare('INSERT INTO sharepoint_profiles(user_id,profile_id) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET profile_id=excluded.profile_id').run(userId, profileId);
  return profileId;
}

async function attachment(profileId, fileName) {
  let next = profiles + '/items(' + profileId + ')/AttachmentFiles?$select=FileName,ServerRelativeUrl';
  const seen = new Set();
  for (let page = 0; next && page < 100; page++) {
    if (seen.has(next)) throw new Error('Invalid attachment pagination');
    seen.add(next);
    const response = await sharePointRequest(next);
    if (!Array.isArray(response.d?.results)) throw new Error('Invalid SharePoint attachments');
    const file = response.d.results.find(item => item.FileName === fileName);
    if (file) {
      if (typeof file.ServerRelativeUrl !== 'string' || !file.ServerRelativeUrl.startsWith('/')) throw new Error('Invalid SharePoint attachment');
      return file.ServerRelativeUrl;
    }
    next = response.d.__next || '';
  }
  if (next) throw new Error('Too many attachment pages');
  return '';
}

async function uploadResume(fileName, bytes, contentType, profileId, digest) {
  let url = await attachment(profileId, fileName);
  if (!url) {
    try {
      await sharePointRequest(profiles + '/items(' + profileId + ")/AttachmentFiles/add(FileName='" + odata(fileName) + "')", { method: 'POST', body: bytes, headers: { 'Content-Type': contentType, 'X-RequestDigest': digest } });
    } catch (error) {
      if (error.status !== 409) throw error;
    }
    url = await attachment(profileId, fileName);
    if (!url) throw new Error('Missing SharePoint attachment');
  }
  return url;
}

async function syncApplication(entry) {
  const payload = JSON.parse(entry.payload);
  const digest = await sharePointDigest();
  const profileId = await findOrCreateProfile(entry.user_id, payload, digest);
  let file;
  if (payload.resumeData) {
    const match = /^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/.exec(payload.resumeData);
    if (!match) throw new Error('Invalid resume data');
    file = await uploadResume('ats-job-' + payload.jobId + '-application-' + entry.application_id + '.pdf', Buffer.from(match[1], 'base64'), 'application/pdf', profileId, digest);
  }
  const summary = [['نام', payload.name], ['ایمیل', payload.email], ['شماره تماس', payload.phone], ['عنوان شغلی', payload.title], ['تاریخ تولد', payload.birthdate], ['جنسیت', payload.gender], ['وضعیت تأهل', payload.marital], ['نظام وظیفه', payload.military], ['حقوق درخواستی', payload.salary], ['نشانی', payload.address], ['زبان‌ها', payload.languages], ['تحصیلات', payload.education], ['سوابق شغلی', payload.experience], ['مهارت‌ها', payload.skills], ['مدارک', payload.certificates], ['درباره کارجو', payload.about]].map(([label, value]) => label + ': ' + (value || 'ثبت نشده')).join('\n\n');
  const details = await uploadResume('ats-job-' + payload.jobId + '-application-' + entry.application_id + '-details.txt', Buffer.from('\ufeff' + summary, 'utf8'), 'text/plain; charset=utf-8', profileId, digest);
  if (!file) file = details;
  if (db.prepare("SELECT 1 FROM sharepoint_outbox WHERE user_id=? AND application_id>? AND status='sent' LIMIT 1").get(entry.user_id, entry.application_id)) return;
  const profile = { __metadata: { type: 'SP.Data.CandidateProfileListItem' }, CandidateName: payload.name, Email: payload.email, Phone: payload.phone, JobTitle: payload.title, Skills: payload.skills, BirthDate: payload.birthdate };
  if (file) profile.ResumeURL = file;
  await sharePointWrite(profiles + '/items(' + profileId + ')', profile, digest, true);
}

export async function runSharePointOutbox() {
  if (running || process.env.SHAREPOINT_WRITES_ENABLED !== 'true') return;
  running = true;
  try {
    for (let count = 0; count < 10; count++) {
      const now = Date.now();
      const entry = db.prepare("UPDATE sharepoint_outbox SET locked_until=? WHERE application_id=(SELECT candidate.application_id FROM sharepoint_outbox candidate WHERE candidate.status='pending' AND candidate.next_attempt<=? AND candidate.locked_until<=? AND NOT EXISTS (SELECT 1 FROM sharepoint_outbox locked WHERE locked.user_id=candidate.user_id AND locked.locked_until>? AND locked.status='pending') ORDER BY candidate.application_id LIMIT 1) RETURNING *").get(now + 900000, now, now, now);
      if (!entry) break;
      try {
        await syncApplication(entry);
        db.prepare("UPDATE sharepoint_outbox SET status='sent', locked_until=0, last_error='' WHERE application_id=?").run(entry.application_id);
      } catch (error) {
        const delay = Math.min(3600000, 60000 * 2 ** Math.min(entry.attempts, 6));
        const reason = error.message === 'Existing profile requires reconciliation' || error.message === 'Profile creation requires reconciliation' ? 'profile_conflict' : 'connection';
        db.prepare('UPDATE sharepoint_outbox SET attempts=attempts+1, next_attempt=?, locked_until=0, last_error=? WHERE application_id=?').run(Date.now() + delay, reason, entry.application_id);
        console.error('SharePoint synchronization failed; retry scheduled');
      }
    }
  } finally { running = false; }
}

export function startSharePointOutbox() {
  if (process.env.SHAREPOINT_WRITES_ENABLED !== 'true') return;
  const run = () => void runSharePointOutbox().catch(() => console.error('SharePoint synchronization worker failed'));
  run();
  setInterval(run, 60000).unref();
}
