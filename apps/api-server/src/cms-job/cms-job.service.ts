import { Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  AddVolDbRequest,
  BackupDbClientRequest,
  CheckDatabaseRequest,
  CompactDatabaseRequest,
  CopyDbRequest,
  CreateDatabaseWithConfigRequest,
  CreateDatabaseWithConfigResponse,
  CmsJobStatusResponse,
  CmsJobType,
  CreateCmsJobResponse,
  LoadDatabaseRequest,
  OptimizeDatabaseRequest,
  RenameDatabaseRequest,
  UnloadDatabaseRequest,
} from '@api-interfaces';
import { extractCmsLongJobFailureMessage, isCmsLongJobFailure } from '@common';
import { DatabaseError } from '@error/database/database-error';
import { DatabaseManagementService } from '@database/management/database-management.service';
import { DatabaseLifecycleService } from '@database/lifecycle/database-lifecycle.service';
import { DatabaseBackupService } from '@database/backup/database-backup.service';
import { EncryptionService } from '@security';
import { LockService } from '@lock/lock.service';
import {
  buildOperationKey,
  CmsJobPayload,
  CmsJobRecord,
  resolveJobDbname,
} from './cms-job.types';
import { CmsJobStore } from './cms-job.store';
import { CMS_JOB_CLEANUP_INTERVAL_MS, isTerminalJobStatus } from './cms-job.cleanup';

@Injectable()
export class CmsJobService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CmsJobService.name);
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly store: CmsJobStore,
    private readonly lockService: LockService,
    private readonly encryptionService: EncryptionService,
    private readonly managementService: DatabaseManagementService,
    private readonly lifecycleService: DatabaseLifecycleService,
    private readonly backupService: DatabaseBackupService
  ) {}

  private userKey(userId: string): string {
    return this.encryptionService.getHashedValue(userId);
  }

  private opsLockFile(userKey: string): string {
    return `jobs-ops-${userKey}`;
  }

  onModuleInit(): void {
    void this.recoverOrphanedJobsOnStartup();
    void this.runJobCleanup('startup');
    this.cleanupTimer = setInterval(
      () => void this.runJobCleanup('interval'),
      CMS_JOB_CLEANUP_INTERVAL_MS
    );
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Restart drops in-process workers; job files may still say queued/running.
   * Clients would poll GET /jobs/:id forever — fail orphans on startup.
   */
  private async recoverOrphanedJobsOnStartup(): Promise<void> {
    if (process.env.CMS_JOB_RECOVER_ON_STARTUP === 'false') {
      return;
    }

    try {
      const count = await this.store.failOrphanedActiveJobs({
        message: 'Job interrupted because the API server restarted.',
        code: 'JOB_INTERRUPTED',
      });
      if (count > 0) {
        this.logger.warn(`Marked ${count} orphaned CMS job(s) as failed after startup`);
      }
    } catch (err: unknown) {
      this.logger.warn(
        `CMS job orphan recovery failed: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  private async runJobCleanup(reason: string): Promise<void> {
    try {
      const removed = await this.store.purgeExpiredJobs();
      if (removed > 0) {
        this.logger.log(`Purged ${removed} CMS job file(s) (${reason})`);
      }
    } catch (err: unknown) {
      this.logger.warn(
        `CMS job cleanup failed (${reason}): ${err instanceof Error ? err.message : err}`
      );
    }
  }

  async createJob(
    userId: string,
    hostUid: string,
    type: CmsJobType,
    dbname: string,
    payload: CmsJobPayload
  ): Promise<CreateCmsJobResponse> {
    const uKey = this.userKey(userId);
    const lockDbname = resolveJobDbname(type, dbname, payload);
    const operationKey = buildOperationKey(userId, hostUid, lockDbname);
    const jobId = uuidv4();

    await this.lockService.withLock(this.opsLockFile(uKey), async () => {
      const ops = await this.store.readOperations(uKey);
      const existingJobId = ops[operationKey];
      if (existingJobId) {
        // Stale lock check: the referenced job may have finished or been deleted without
        // releasing the lock (e.g. server crash before finally block ran).
        // Without this check a dead lock blocks the same DB operation for up to 1 hour.
        const existingJob = await this.store.getJob(uKey, existingJobId);
        const isStale = !existingJob || isTerminalJobStatus(existingJob.status);
        if (isStale) {
          this.logger.warn(
            `Clearing stale operation lock for ${operationKey} (job ${existingJobId} is ${existingJob?.status ?? 'missing'})`
          );
          delete ops[operationKey];
        } else {
          throw DatabaseError.OperationInProgress({
            hostUid,
            dbname: lockDbname,
            existingJobId,
          });
        }
      }
      ops[operationKey] = jobId;
      await this.store.writeOperations(uKey, ops);
    });

    const record: CmsJobRecord = {
      jobId,
      userId,
      hostUid,
      dbname: lockDbname,
      type,
      status: 'queued',
      createdAt: new Date().toISOString(),
      payload,
    };
    await this.store.saveJob(uKey, record);

    setImmediate(() => {
      void this.runJob(uKey, jobId, operationKey).catch((err) => {
        this.logger.error(`Job ${jobId} crashed: ${err?.message || err}`, err?.stack);
      });
    });

    return { jobId };
  }

  createUnloadJob(
    userId: string,
    hostUid: string,
    dbname: string,
    payload: UnloadDatabaseRequest
  ): Promise<CreateCmsJobResponse> {
    return this.createJob(userId, hostUid, 'unload', dbname, payload);
  }

  createLoadJob(
    userId: string,
    hostUid: string,
    dbname: string,
    payload: LoadDatabaseRequest
  ): Promise<CreateCmsJobResponse> {
    return this.createJob(userId, hostUid, 'load', dbname, payload);
  }

  private applyCmsOutcome(job: CmsJobRecord, cmsResponse: unknown): boolean {
    if (job.type === 'create') {
      const res = cmsResponse as CreateDatabaseWithConfigResponse;
      const ops: Array<{ success: boolean; error?: { message: string; code?: string } }> = [
        res?.createDatabase,
        res?.startDatabase,
        res?.updateUser,
        res?.setAutoAddVol,
        res?.setAutoStart,
      ].filter(Boolean) as any;

      const failed = ops.find((op) => op.success === false);
      if (failed) {
        job.status = 'failed';
        job.error = {
          message: failed.error?.message || 'Create database failed',
          code: failed.error?.code,
        };
        job.result = res;
        return false;
      }

      job.status = 'succeeded';
      job.result = res;
      return true;
    }

    if (isCmsLongJobFailure(cmsResponse)) {
      job.status = 'failed';
      job.error = {
        message: extractCmsLongJobFailureMessage(cmsResponse),
        cmsStatus: String((cmsResponse as { status?: string }).status ?? ''),
      };
      return false;
    }

    job.status = 'succeeded';
    job.result = this.mapJobResult(job, cmsResponse);
    return true;
  }

  private mapJobResult(job: CmsJobRecord, cmsResponse: unknown): unknown {
    if (!cmsResponse || typeof cmsResponse !== 'object') {
      return { success: true };
    }

    const response = cmsResponse as Record<string, unknown>;

    switch (job.type) {
      case 'unload':
        return response.result ?? {};
      case 'compact':
        return response.log
          ? { success: true, log: response.log }
          : { success: true };
      case 'addvol':
        return {
          dbname: response.dbname,
          purpose: response.purpose,
        };
      default:
        return { success: true };
    }
  }

  private cmsResponseFromError(err: unknown): unknown | undefined {
    if (!err || typeof err !== 'object') {
      return undefined;
    }
    const additional = (err as { additionalData?: { response?: unknown } }).additionalData;
    return additional?.response;
  }

  private async executeCmsForJob(job: CmsJobRecord): Promise<unknown> {
    const { userId, hostUid, type, payload } = job;

    switch (type) {
      case 'create':
        return this.lifecycleService.createDatabase(
          userId,
          hostUid,
          payload as CreateDatabaseWithConfigRequest
        );
      case 'unload':
        return this.managementService.unloadDatabaseCmsResponse(
          userId,
          hostUid,
          job.dbname,
          payload as UnloadDatabaseRequest
        );
      case 'load':
        return this.managementService.loadDatabaseCmsResponse(
          userId,
          hostUid,
          job.dbname,
          payload as LoadDatabaseRequest
        );
      case 'optimize':
        return this.managementService.optimizeDatabaseCmsResponse(
          userId,
          hostUid,
          job.dbname,
          payload as OptimizeDatabaseRequest
        );
      case 'check':
        return this.managementService.checkDatabaseCmsResponse(
          userId,
          hostUid,
          job.dbname,
          payload as CheckDatabaseRequest
        );
      case 'compact':
        return this.managementService.compactDatabaseCmsResponse(
          userId,
          hostUid,
          job.dbname,
          payload as CompactDatabaseRequest
        );
      case 'copy':
        return this.managementService.copyDbCmsResponse(
          userId,
          hostUid,
          payload as CopyDbRequest
        );
      case 'addvol':
        return this.managementService.addVolDbCmsResponse(
          userId,
          hostUid,
          job.dbname,
          payload as AddVolDbRequest
        );
      case 'rename':
        return this.managementService.renameDatabaseCmsResponse(
          userId,
          hostUid,
          job.dbname,
          payload as RenameDatabaseRequest
        );
      case 'backupdb':
        return this.backupService.backupDb(
          userId,
          hostUid,
          job.dbname,
          payload as BackupDbClientRequest
        );
      default:
        throw new Error(`Unsupported job type: ${type}`);
    }
  }

  private async runJob(uKey: string, jobId: string, operationKey: string): Promise<void> {
    const job = await this.store.getJob(uKey, jobId);
    if (!job) return;

    job.status = 'running';
    job.startedAt = new Date().toISOString();
    await this.store.saveJob(uKey, job);

    try {
      const cmsResponse = await this.executeCmsForJob(job);
      const succeeded = this.applyCmsOutcome(job, cmsResponse);

      if (succeeded && (job.type === 'rename' || job.type === 'copy')) {
        job.result = await this.managementService.getDatabaseStartInfo(job.userId, job.hostUid);
      }
    } catch (err: unknown) {
      if (job.type === 'create') {
        job.status = 'failed';
        job.error = {
          message: err instanceof Error ? err.message : 'Create database failed',
        };
      } else {
        const cmsFromError = this.cmsResponseFromError(err);
        if (cmsFromError && isCmsLongJobFailure(cmsFromError)) {
          this.applyCmsOutcome(job, cmsFromError);
        } else {
          job.status = 'failed';
          job.error = {
            message: err instanceof Error ? err.message : 'CMS operation failed',
          };
        }
      }
    } finally {
      job.finishedAt = new Date().toISOString();
      await this.store.saveJob(uKey, job);
      await this.lockService.withLock(this.opsLockFile(uKey), async () => {
        const ops = await this.store.readOperations(uKey);
        if (ops[operationKey] === jobId) {
          delete ops[operationKey];
          await this.store.writeOperations(uKey, ops);
        }
      });
    }
  }

  async getJob(userId: string, jobId: string): Promise<CmsJobStatusResponse> {
    const record = await this.store.getJob(this.userKey(userId), jobId);
    if (!record || record.userId !== userId) {
      throw new NotFoundException(`Job not found: ${jobId}`);
    }
    return this.toStatusResponse(record);
  }

  async listActiveJobs(userId: string): Promise<CmsJobStatusResponse[]> {
    const jobs = await this.store.listJobsForUser(this.userKey(userId));
    return jobs
      .filter((j) => j.userId === userId && (j.status === 'queued' || j.status === 'running'))
      .map((j) => this.toStatusResponse(j));
  }

  private toStatusResponse(record: CmsJobRecord): CmsJobStatusResponse {
    return {
      jobId: record.jobId,
      type: record.type,
      jobStatus: record.status,
      hostUid: record.hostUid,
      dbname: record.dbname,
      createdAt: record.createdAt,
      startedAt: record.startedAt,
      finishedAt: record.finishedAt,
      result: record.result,
      error: record.error,
    };
  }
}
