/**
 * Client-facing response for start info.
 * Strips CMS envelope fields from StartInfoCmsResponse.
 */
export type StartInfoClientResponse = {
  activelist: {
    active: {
      dbname: string;
    }[];
  };
  dblist: {
    dbs: {
      dbdir: string;
      dbname: string;
      isProfileExists: boolean;
      /** True when this DB participates in HA on this host (startinfo + heartbeat + cubridconf). */
      isHA: boolean;
    }[];
  };
};
