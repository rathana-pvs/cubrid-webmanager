const runtime = process.env.CWM_E2E_RUNTIME || 'web';
const { getCmsTarget, getCredentials } = require('./env');

if (!['web', 'electron'].includes(runtime)) {
  throw new Error(`Unsupported CWM_E2E_RUNTIME: ${runtime}`);
}

// Normalize the CMS target for both runtimes. Several shared specs use the
// environment variables directly, so leaving the documented defaults only
// inside getCmsTarget() makes web and Electron behave differently.
const host = getCmsTarget();
process.env.E2E_HOST_ADDRESS ||= host.address;
process.env.E2E_HOST_PORT ||= String(host.port);
process.env.E2E_HOST_USER ||= host.id;
process.env.E2E_HOST_PASSWORD ||= host.password;
process.env.E2E_HOST_ALIAS ||= host.alias;

if (runtime === 'electron') {
  const credentials = getCredentials();
  process.env.E2E_USERNAME ||= credentials.username;
  process.env.E2E_PASSWORD ||= credentials.password;
}

module.exports = runtime === 'electron'
  ? require('../electron/fixture')
  : require('../web/fixture');
