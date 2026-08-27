const { execSync } = require('child_process');

const VPS_HOST = process.env.CWM_E2E_CMS_ADDRESS || '100.100.97.116';
const VPS_USER = process.env.VPS_USER || 'rathana';
const VPS_PASS = process.env.VPS_PASS || '12345';
const DOCKER_CONTAINER = process.env.CUBRID_CONTAINER || 'cubrid-11.4';

console.log(`🧹 Cleaning test data on VPS (${VPS_HOST})...`);

const cmd = `sshpass -p '${VPS_PASS}' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "` +
  `echo ${VPS_PASS} | sudo -S docker exec ${DOCKER_CONTAINER} rm -rf /home/cubrid/CUBRID/databases/e2e_* /home/cubrid/CUBRID/databases/testbench /home/cubrid/CUBRID/databases/unloaddb.info; ` +
  `echo ${VPS_PASS} | sudo -S docker exec ${DOCKER_CONTAINER} sed -i '/e2e_/d' /home/cubrid/CUBRID/databases/databases.txt; ` +
  `echo ${VPS_PASS} | sudo -S docker exec ${DOCKER_CONTAINER} sed -i '/e2e_/d' /home/cubrid/CUBRID/conf/cmdb.pass; ` +
  `echo ${VPS_PASS} | sudo -S docker exec ${DOCKER_CONTAINER} truncate -s 0 /home/cubrid/CUBRID/conf/autoaddvoldb.conf; ` +
  `echo ${VPS_PASS} | sudo -S docker exec ${DOCKER_CONTAINER} truncate -s 0 /home/cubrid/CUBRID/conf/autobackupdb.conf; ` +
  `echo ${VPS_PASS} | sudo -S docker exec ${DOCKER_CONTAINER} truncate -s 0 /home/cubrid/CUBRID/conf/autoexecquery.conf; ` +
  `echo ${VPS_PASS} | sudo -S docker exec ${DOCKER_CONTAINER} gosu cubrid cubrid server stop db1 2>/dev/null; ` +
  `echo ${VPS_PASS} | sudo -S docker exec ${DOCKER_CONTAINER} gosu cubrid cubrid server start demodb 2>/dev/null; ` +
  `echo ${VPS_PASS} | sudo -S docker exec ${DOCKER_CONTAINER} gosu cubrid cubrid server status"`;

try {
  const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  console.log(output);
  console.log('✅ VPS test data cleaned successfully.');
} catch (err) {
  console.error('❌ Failed to clean VPS test data:', err.message);
  process.exit(1);
}
