/**
 * Client response type for class information.
 * Returns domain-only data (CMS envelope removed).
 *
 * @category Client Responses
 * @since 1.0.0
 */
export type ClassInfoResponse = {
  /**
   * Database name
   */
  dbname: string;

  /**
   * System classes array
   */
  systemclass: Array<{
    /**
     * Array of system class objects
     */
    class: Array<{
      /**
       * Class name
       */
      classname: string;

      /**
       * Class owner
       */
      owner: string;

      /**
       * Virtual type
       * Values: "normal" | "view" | other values
       */
      virtual: string;
    }>;
  }>;

  /**
   * User classes array
   */
  userclass: Array<{
    /**
     * Array of user class objects
     */
    class: Array<{
      /**
       * Class name
       */
      classname: string;

      /**
       * Class owner
       */
      owner: string;

      /**
       * Virtual type
       * Values: "normal" | "view" | other values
       */
      virtual: string;
    }>;
  }>;
};
