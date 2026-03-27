import { GetDbmtUserInfoClientResponse } from './get-dbmt-user-info-client-response';

/** DB list item in updatedbmtuser response */
export type UpdateDbmtUserDblistItem = {
  dbs: Array<{ dbname: string }>;
};

/** User list item in updatedbmtuser response (per broker) */
export type UpdateDbmtUserUserlistItem = {
  user: Array<Record<string, unknown>>;
};

/**
 * Client response for updatedbmtuser (same as getdbmtuserinfo).
 */
export type UpdateDbmtUserClientResponse = GetDbmtUserInfoClientResponse;

