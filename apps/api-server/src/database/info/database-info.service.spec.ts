import { Test, TestingModule } from '@nestjs/testing';
import type { GetEnvClientResponse } from '@api-interfaces';
import { DatabaseInfoService } from './database-info.service';
import { HostService } from '@host';
import { CmsHttpsClientService } from '@cms-https-client/cms-https-client.service';
import { CmsConfigService } from '@cms-config/cms-config.service';
import * as common from '@common';
import type { GetEnvClientResponse } from '@api-interfaces';
import { CmsError } from '@error/cms/cms-error';

// Real GetEnv values (e.g. BROKERVER, CUBRIDVER) vary by host; tests use fixed mock data only.
const mockGetEnvForCreatedb: GetEnvClientResponse = {
  BROKERVER: '11.4',
  CUBRID: '/opt/cubrid',
  CUBRIDVER: '11.4',
  CUBRID_DATABASES: '/opt/cubrid/databases',
  CUBRID_DBMT: '',
  HOSTMONTAB0: '',
  HOSTMONTAB1: '',
  HOSTMONTAB2: '',
  HOSTMONTAB3: '',
  osinfo: 'Linux',
};

jest.mock('@common', () => ({
  ...jest.requireActual('@common'),
  checkCmsTokenError: jest.fn(),
  checkCmsStatusError: jest.fn(),
}));

describe('DatabaseInfoService', () => {
  let service: DatabaseInfoService;
  let hostService: jest.Mocked<HostService>;
  let cmsClient: jest.Mocked<CmsHttpsClientService>;
  let cmsConfigService: jest.Mocked<CmsConfigService>;

  const mockHost = {
    uid: 'host-uid-1',
    id: 'host-1',
    address: 'localhost',
    port: 8001,
    password: 'host-password',
    token: 'test-token',
    dbProfiles: {},
  };

  const mockUserId = 'user-123';
  const mockHostUid = 'host-uid-1';

  beforeEach(async () => {
    const mockHostService = { findHostInternal: jest.fn() };
    const mockCmsClient = { postAuthenticated: jest.fn() };
    const mockCmsConfigService = { getEnv: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseInfoService,
        { provide: HostService, useValue: mockHostService },
        { provide: CmsHttpsClientService, useValue: mockCmsClient },
        { provide: CmsConfigService, useValue: mockCmsConfigService },
      ],
    }).compile();

    service = module.get(DatabaseInfoService);
    hostService = module.get(HostService);
    cmsClient = module.get(CmsHttpsClientService);
    cmsConfigService = module.get(CmsConfigService);

    hostService.findHostInternal.mockResolvedValue(mockHost);
    (common.checkCmsTokenError as jest.Mock).mockImplementation(() => {});
    (common.checkCmsStatusError as jest.Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startInfoInternal', () => {
    it('should return raw CMS startinfo response', async () => {
      const mockResponse = {
        __EXEC_TIME: '10 ms',
        note: 'none',
        status: 'success',
        task: 'startinfo',
        dblist: [{ dbs: [{ dbname: 'testdb' }] }],
        activelist: [{ active: [] }],
      };
      cmsClient.postAuthenticated.mockResolvedValue(mockResponse);

      const result = await service.startInfoInternal(mockUserId, mockHostUid);

      expect(hostService.findHostInternal).toHaveBeenCalledWith(mockUserId, mockHostUid);
      expect(cmsClient.postAuthenticated).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ task: 'startinfo' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw CmsError when CMS status is not success', async () => {
      cmsClient.postAuthenticated.mockResolvedValue({
        status: 'fail',
        task: 'startinfo',
        note: 'failed',
      });

      await expect(
        service.startInfoInternal(mockUserId, mockHostUid)
      ).rejects.toThrow(CmsError);
    });
  });

  describe('startInfo', () => {
    it('should return client start info with isProfileExists', async () => {
      const mockCmsResponse = {
        __EXEC_TIME: '10 ms',
        note: 'none',
        status: 'success',
        task: 'startinfo',
        dblist: [{ dbs: [{ dbname: 'testdb', dbdir: '/path' }] }],
        activelist: [{ active: [{ dbname: 'testdb' }] }],
      };
      cmsClient.postAuthenticated.mockResolvedValue(mockCmsResponse);

      const result = await service.startInfo(mockUserId, mockHostUid);

      expect(result).toEqual({
        activelist: { active: [{ dbname: 'testdb' }] },
        dblist: {
          dbs: [{ dbname: 'testdb', dbdir: '/path', isProfileExists: false }],
        },
      });
    });
  });

  describe('getCreatedbInfo', () => {
    it('should return create info from env', async () => {
      cmsConfigService.getEnv.mockResolvedValue(mockGetEnvForCreatedb);

      const result = await service.getCreatedbInfo(mockUserId, mockHostUid);

      expect(cmsConfigService.getEnv).toHaveBeenCalledWith(mockUserId, mockHostUid);
      expect(result).toEqual({
        defaultDbDirectory: '/opt/cubrid/databases',
        cubridVersion: '11.4', // Matches mock CUBRIDVER; not tied to any real deployment version
        cubridPath: '/opt/cubrid',
      });
    });
  });
});
