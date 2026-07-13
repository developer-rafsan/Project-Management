export function migrateProjectWebsiteFields(data, existingData = null) {
  if (!data) return data;

  const additionalWebsites = data.additionalWebsites;
  const hasOldFields = data.websiteUrl && typeof data.websiteUrl === 'string' && data.websiteUrl.trim() !== '';

  const isEmpty = !additionalWebsites || !Array.isArray(additionalWebsites) || additionalWebsites.length === 0;

  if (hasOldFields && isEmpty) {
    const existing = existingData || {};
    return {
      ...data,
      additionalWebsites: [{
        name: 'Main Website',
        url: data.websiteUrl || existing.websiteUrl || '',
        username: data.websiteUsername || existing.websiteUsername || '',
        password: data.websitePassword || existing.websitePassword || {},
      }],
    };
  }

  return data;
}
