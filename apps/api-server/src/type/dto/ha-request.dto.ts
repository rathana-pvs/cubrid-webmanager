import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Validated request body for HaController's heartbeat-list endpoint.
 * Mirrors HeartbeatListClientRequest (libs/api-interfaces).
 *
 * @category DTOs
 * @since 1.0.0
 */
export class HeartbeatListDto {
  @IsString()
  @IsNotEmpty()
  dbmodeall: string;
}
