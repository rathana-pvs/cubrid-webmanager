#!/usr/bin/env node

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { getCmsTarget, getCredentials, requireWebEnvironment } = require('./env');

requireWebEnvironment();

const baseUrl = (process.env.BASE_URL || 'https://localhost:8080').replace(/\/$/, '');
const apiUrl = `${baseUrl}/api`;
const credentials = getCredentials();
const host = getCmsTarget();

async function request(route, options = {}) {
  const response = await fetch(`${apiUrl}${route}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: response.ok, status: response.status, body };
}

async function main() {
  const registration = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ id: credentials.username, password: credentials.password }),
  });
  if (!registration.ok && ![400, 409].includes(registration.status)) {
    throw new Error(`Registration failed (${registration.status}): ${JSON.stringify(registration.body)}`);
  }

  const login = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ id: credentials.username, password: credentials.password }),
  });
  const token = login.body?.data?.token || login.body?.token;
  if (!login.ok || !token) {
    throw new Error(`Login failed (${login.status}): ${JSON.stringify(login.body)}`);
  }

  const hostList = await request('/host', { headers: { Authorization: `Bearer ${token}` } });
  if (!hostList.ok) {
    throw new Error(`Host listing failed (${hostList.status}): ${JSON.stringify(hostList.body)}`);
  }

  const groups = hostList.body?.data?.host_groups || hostList.body?.host_groups || {};
  for (const [groupName, groupData] of Object.entries(groups)) {
    if (groupName !== 'Default Group' && groupName !== 'DEFAULT') {
      await request(`/host/group/${encodeURIComponent(groupName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
  }

  const matchingHosts = Object.values(groups).flatMap((group) =>
    Object.entries(group?.hosts || {})
      .filter(([, saved]) =>
        saved.address === host.address
        && Number(saved.port) === host.port
        && saved.id === host.id
      )
      .map(([uid, saved]) => ({ uid: saved.uid || uid }))
  );

  if (matchingHosts.length === 0) {
    const added = await request('/host', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(host),
    });
    if (!added.ok) {
      throw new Error(`Host seeding failed (${added.status}): ${JSON.stringify(added.body)}`);
    }
  } else {
    const [canonical, ...duplicates] = matchingHosts;

    // Import/export and interrupted E2E runs can leave duplicate copies of
    // the configured target. Remove only those exact connection duplicates
    // before updating, otherwise the backend's duplicate guard rejects PUT.
    for (const duplicate of duplicates) {
      const removed = await request(`/host/${duplicate.uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!removed.ok) {
        throw new Error(`Duplicate host cleanup failed (${removed.status}): ${JSON.stringify(removed.body)}`);
      }
    }

    // Reapply the configured identity and credential. This repairs a host
    // record left with an invalid password when a previous test was aborted.
    const updated = await request(`/host/${canonical.uid}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(host),
    });
    if (!updated.ok) {
      throw new Error(`Host repair failed (${updated.status}): ${JSON.stringify(updated.body)}`);
    }
  }

  const activeHostUid = matchingHosts.length > 0 ? matchingHosts[0].uid : (
    (await request('/host', { headers: { Authorization: `Bearer ${token}` } }))
      .body?.data?.host_groups?.['Default Group']?.hosts?.[0]?.uid
  );

  if (activeHostUid) {
    await request(`/${activeHostUid}/cms-auth/login`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: host.id, password: host.password }),
    }).catch(() => undefined);

    const dbname = process.env.E2E_DB || 'demodb';
    await request(`/${activeHostUid}/database/register/${encodeURIComponent(dbname)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'dba', password: '' }),
    }).catch(() => undefined);

    const offlineDb = process.env.E2E_OFFLINE_DB || 'db1';
    await request(`/${activeHostUid}/database/register/${encodeURIComponent(offlineDb)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: 'dba', password: 'admin123' }),
    }).catch(() => undefined);
  }

  console.log(
    `Seeded E2E account and CMS target ${host.address}:${host.port}`
    + (matchingHosts.length > 1 ? `; removed ${matchingHosts.length - 1} duplicate(s).` : '.')
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
