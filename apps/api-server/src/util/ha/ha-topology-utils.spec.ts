import {
  computeHaDbTopology,
  extractDbNamesFromHeartbeatList,
  extractDbNamesFromStartInfo,
  flattenHanodelist,
  getPerDbHaModeOffDbNames,
  isHostHaModeOnFromCubridConf,
  parseHaDbListDbNamesFromHaConf,
  resolveCurrentNodeRole,
} from './ha-topology-utils';
import type { GetAllSysParamCmsResponse } from '@type/cms-response/get-all-sys-param-cms-response';
import type { HeartbeatListCmsResponse } from '@type/cms-response/heartbeat-list-cms-response';
import type { StartInfoCmsResponse } from '@type/cms-response/start-info-cms-response';

function mockCubridConf(lines: string[]): Pick<GetAllSysParamCmsResponse, 'conflist'> {
  return {
    conflist: [{ confdata: lines }],
  };
}

describe('ha-topology-utils', () => {
  describe('isHostHaModeOnFromCubridConf', () => {
    it('returns true when [common] ha_mode=on', () => {
      expect(
        isHostHaModeOnFromCubridConf(
          mockCubridConf(['[common]', 'ha_mode=on', '[service]', 'x=1'])
        )
      ).toBe(true);
    });

    it('is case-insensitive for on', () => {
      expect(isHostHaModeOnFromCubridConf(mockCubridConf(['[common]', 'ha_mode=ON']))).toBe(true);
    });

    it('returns false when ha_mode is off or missing', () => {
      expect(isHostHaModeOnFromCubridConf(mockCubridConf(['[common]', 'ha_mode=off']))).toBe(false);
      expect(isHostHaModeOnFromCubridConf(mockCubridConf(['[service]', 'x=1']))).toBe(false);
    });
  });

  describe('getPerDbHaModeOffDbNames', () => {
    it('collects dbname from [@db] sections with ha_mode=off', () => {
      const conf = mockCubridConf([
        '[common]',
        'ha_mode=on',
        '[@demodb]',
        'ha_mode=off',
        '[@other]',
        'ha_mode=on',
      ]);
      expect([...getPerDbHaModeOffDbNames(conf)]).toEqual(['demodb']);
    });
  });

  describe('parseHaDbListDbNamesFromHaConf', () => {
    it('parses comma-separated ha_db_list under [common]', () => {
      const conf = mockCubridConf(['[common]', 'ha_db_list=demodb, testdb', 'ha_port_id=59901']);
      expect([...parseHaDbListDbNamesFromHaConf(conf)].sort()).toEqual(['demodb', 'testdb']);
    });

    it('returns empty set when ha_db_list is missing or empty', () => {
      expect([...parseHaDbListDbNamesFromHaConf(mockCubridConf(['[common]', 'ha_port_id=1']))]).toEqual(
        []
      );
      expect([...parseHaDbListDbNamesFromHaConf(mockCubridConf(['[common]', 'ha_db_list=']))]).toEqual(
        []
      );
    });
  });

  describe('extractDbNamesFromStartInfo', () => {
    it('collects dbname from dblist', () => {
      const r: Pick<StartInfoCmsResponse, 'dblist'> = {
        dblist: [
          {
            dbs: [
              { dbname: 'a', dbdir: '/x' },
              { dbname: 'b', dbdir: '/y' },
            ],
          },
        ],
      };
      expect(extractDbNamesFromStartInfo(r)).toEqual(['a', 'b']);
    });

    it('dedupes and sorts', () => {
      const r: Pick<StartInfoCmsResponse, 'dblist'> = {
        dblist: [{ dbs: [{ dbname: 'z', dbdir: '/' }, { dbname: 'a', dbdir: '/' }] }],
      };
      expect(extractDbNamesFromStartInfo(r)).toEqual(['a', 'z']);
    });
  });

  describe('extractDbNamesFromHeartbeatList', () => {
    it('collects from dbmode, dbprocinfo, applylogdb, copylogdb', () => {
      const r: Pick<HeartbeatListCmsResponse, 'hadbinfolist'> = {
        hadbinfolist: [
          {
            server: [
              {
                dbmode: [{ dbname: 'm1', server_mode: 'x', server_msg: '' }],
                dbprocinfo: [{ dbname: 'p1', pid: '1', state: 'x' }],
                applylogdb: [
                  {
                    element: [
                      { dbname: 'a1', hostname: 'h', logpath: '/', pid: '1', state: 's' },
                    ],
                  },
                ],
                copylogdb: [
                  {
                    element: [
                      {
                        dbname: 'c1',
                        hostname: 'h',
                        logpath: '/',
                        mode: 'm',
                        pid: '1',
                        state: 's',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(extractDbNamesFromHeartbeatList(r)).toEqual(['a1', 'c1', 'm1', 'p1']);
    });

    it('returns empty when hadbinfolist missing', () => {
      expect(extractDbNamesFromHeartbeatList({})).toEqual([]);
    });
  });

  describe('computeHaDbTopology', () => {
    it('marks effectiveHaDb when host HA + in both lists and not conf off', () => {
      expect(
        computeHaDbTopology({
          hostHaEnabled: true,
          startInfoNames: ['a', 'b'],
          heartbeatNames: ['a'],
          confHaModeOffNames: [],
        })
      ).toEqual([
        {
          dbname: 'a',
          inStartInfo: true,
          inHeartbeat: true,
          confHaModeOff: false,
          effectiveHaDb: true,
        },
        {
          dbname: 'b',
          inStartInfo: true,
          inHeartbeat: false,
          confHaModeOff: false,
          effectiveHaDb: false,
        },
      ]);
    });

    it('conf ha_mode=off disables effectiveHaDb even when in both sets', () => {
      expect(
        computeHaDbTopology({
          hostHaEnabled: true,
          startInfoNames: ['a'],
          heartbeatNames: ['a'],
          confHaModeOffNames: ['a'],
        })
      ).toEqual([
        {
          dbname: 'a',
          inStartInfo: true,
          inHeartbeat: true,
          confHaModeOff: true,
          effectiveHaDb: false,
        },
      ]);
    });

    it('hostHaEnabled false forces effectiveHaDb false', () => {
      expect(
        computeHaDbTopology({
          hostHaEnabled: false,
          startInfoNames: ['a'],
          heartbeatNames: ['a'],
          confHaModeOffNames: [],
        })[0].effectiveHaDb
      ).toBe(false);
    });
  });

  describe('flattenHanodelist / resolveCurrentNodeRole', () => {
    it('flattens hanodelist blocks', () => {
      const flat = flattenHanodelist([
        {
          node: [
            { hostname: 'a', ip: '1', priority: '1', state: 'master' },
            { hostname: 'b', ip: '2', priority: '2', state: 'slave' },
          ],
        },
      ]);
      expect(flat).toEqual([
        { hostname: 'a', ip: '1', priority: '1', state: 'master' },
        { hostname: 'b', ip: '2', priority: '2', state: 'slave' },
      ]);
    });

    it('resolves role from matching hostname', () => {
      const nodes = [{ hostname: 'n1', ip: '', priority: '', state: 'replica' }];
      expect(resolveCurrentNodeRole('n1', 'ignored', nodes)).toBe('replica');
      expect(resolveCurrentNodeRole(undefined, 'slave', [])).toBe('slave');
    });
  });
});
