export const resumeCollections = {
  experience_items: { legacy: 'experience', legacyField: 'description', fields: ['role', 'company', 'start', 'end', 'description'] },
  education_items: { legacy: 'education', legacyField: 'description', fields: ['degree', 'field', 'institution', 'start', 'end', 'description'] },
  skill_items: { legacy: 'skills', legacyField: 'name', fields: ['name', 'level'] },
  certificate_items: { legacy: 'certificates', legacyField: 'name', fields: ['name', 'issuer', 'date', 'description'] },
};

export function parseExtra(value) {
  try { const data = JSON.parse(value || '{}'); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; }
  catch { return {}; }
}

export function withResumeCollections(user) {
  if (!user) return null;
  const extra = parseExtra(user.profile_extra);
  const result = { ...user, ...extra };
  for (const [key, config] of Object.entries(resumeCollections)) {
    if (Array.isArray(extra[key])) result[key] = extra[key];
    else {
      const previous = result[config.legacy];
      result[key] = typeof previous === 'string' && previous.trim() ? [{ [config.legacyField]: previous }] : [];
    }
  }
  return result;
}

export function cleanCollection(items, fields) {
  if (!Array.isArray(items)) return null;
  return items.slice(0, 50).filter(item => item && typeof item === 'object' && !Array.isArray(item)).map(item => Object.fromEntries(fields.map(field => [field, typeof item[field] === 'string' ? item[field].trim().slice(0, 2000) : '']))).filter(item => Object.values(item).some(Boolean));
}

export function summarizeCollection(items, fields) {
  return items.map(item => fields.map(field => item[field]).filter(Boolean).join(' | ')).join('\n');
}
