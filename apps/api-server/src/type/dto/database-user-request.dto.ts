import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

/**
 * Validated request bodies for DatabaseUserController. Kept as backend-only
 * classes (mirroring the shared @api-interfaces types) so class-validator
 * decorators don't end up bundled into the frontend's copy of those types.
 *
 * @category DTOs
 * @since 1.0.0
 */
class UserGroupsDto {
  @IsArray()
  @IsString({ each: true })
  group: string[];
}

export class UserVerifyDto {
  @IsString()
  @IsNotEmpty()
  dbname: string;

  @IsString()
  @IsNotEmpty()
  dbuser: string;

  // A DB user can legitimately have an empty password (see CreateDbUserDto)
  // — verifying such a user means checking dbpasswd === ''.
  @IsString()
  dbpasswd: string;
}

export class CreateDbUserDto {
  @IsString()
  @IsNotEmpty()
  dbname: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  // CUBRID allows a user to be created/updated with no password (empty
  // string) — the original validateRequiredFields only checked presence
  // (value == null), never emptiness. @IsString() alone preserves that:
  // rejects missing/undefined, still allows ''.
  @IsString()
  userpass: string;

  @ValidateNested()
  @Type(() => UserGroupsDto)
  groups: UserGroupsDto;

  @IsArray()
  authorization: unknown[];
}

export class UpdateDbUserBodyDto {
  @IsString()
  userpass: string;

  @ValidateNested()
  @Type(() => UserGroupsDto)
  groups: UserGroupsDto;

  @IsArray()
  @IsString({ each: true })
  authorization: string[];
}

/**
 * login/:dbname does not fall back to a stored profile — id/password are
 * required (present) here, but password may legitimately be '' (see
 * CreateDbUserDto — a DB user can have an empty password).
 */
export class DatabaseLoginBodyDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  password: string;
}
