import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Validated request body for changing the current user's password.
 * Mirrors `ChangePasswordRequest` (libs/api-interfaces) — kept as a
 * separate backend-only class so class-validator decorators don't end up
 * bundled into the shared interface the frontend also imports.
 *
 * @category DTOs
 * @since 1.0.0
 */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
