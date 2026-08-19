import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for user authentication.
 *
 * Used for login and registration requests containing
 * user credentials.
 *
 * @category DTOs
 * @since 1.0.0
 */
export class UserDTO {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
