/**
 * Client-facing plandump: CMS `log[].line[]` is flattened for display and APIs.
 *
 * @category Responses
 * @since 1.0.0
 */
export type PlandumpClientResponse = {
  /** Every output line in order (flattened from CMS `log[].line`). */
  lines: string[];
  /** Full dump as a single string (`lines.join('\\n')`). */
  text: string;
};
