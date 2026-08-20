import { BaseCmsResponse } from './base-cms-response';

export type StartInfoCmsResponse = BaseCmsResponse & {
  // CMS can return `null` for activelist/dblist themselves, and for each
  // entry's nested array, instead of an empty array.
  activelist: Array<{
    active: { dbname: string }[] | null;
  }> | null;
  dblist: Array<{
    dbs:
      | {
          dbdir: string;
          dbname: string;
        }[]
      | null;
  }> | null;
};
