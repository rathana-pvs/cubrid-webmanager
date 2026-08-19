import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Validated request body for deleting the current user's account.
 * Mirrors `DeleteUserRequest` (libs/api-interfaces) — kept as a separate
 * backend-only class so class-validator decorators don't end up bundled
 * into the shared interface the frontend also imports.
 *
 * @category DTOs
 * @since 1.0.0
 */
export class DeleteUserDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
