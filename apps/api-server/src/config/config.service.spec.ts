import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let prevSeed: string | undefined;
  let prevSalt: string | undefined;

  beforeEach(async () => {
    prevSeed = process.env.SEED;
    prevSalt = process.env.SALT;
    process.env.SEED = 'test-seed';
    process.env.SALT = 'test-salt';
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    if (prevSeed === undefined) {
      delete process.env.SEED;
    } else {
      process.env.SEED = prevSeed;
    }
    if (prevSalt === undefined) {
      delete process.env.SALT;
    } else {
      process.env.SALT = prevSalt;
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
