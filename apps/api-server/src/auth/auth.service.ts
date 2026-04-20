import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '@security';
import { User, UserDTO } from '@type/index';
import { UserRepositoryService } from '@repository';
import { UserError } from '@error/user/user-error';
import { HandleAuthErrors } from '@common';

/**
 * Service for handling authentication operations.
 *
 * Provides business logic for user authentication including login validation,
 * JWT token generation, and user registration. All operations are wrapped
 * with error handling decorators.
 *
 * @category Business Services
 * @since 1.0.0
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UserRepositoryService,
    private readonly jwt: JwtService,
    private readonly password: PasswordService
  ) {}
  /**
   * Authenticates a user and generates a JWT token.
   *
   * Validates user credentials by checking if the user exists and comparing
   * the provided password with the stored hash. Returns a JWT token on
   * successful authentication.
   *
   * @param {UserDTO} dto - User credentials containing id and password
   * @returns {Promise<string>} JWT token for authenticated requests
   * @throws {UserError} When user is not found or password is incorrect
   * @example
   * ```typescript
   * const token = await authService.login({
   *   id: "user123",
   *   password: "password123"
   * });
   * console.log(token); // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * ```
   */
  @HandleAuthErrors()
  async login(dto: UserDTO): Promise<string> {
    const user: User | null = await this.usersRepo.loadUserById(dto.id);
    if (!user) {
      throw UserError.UserNotFound({ userId: dto.id });
    }

    const ok = await this.password.comparePlainAndHash(dto.password, user.password);
    if (!ok) {
      throw UserError.UserNotFound({ userId: dto.id });
    }

    const payload = { sub: user.id };
    const token = await this.jwt.signAsync(payload);
    return token;
  }

  /**
   * Registers a new user account.
   *
   * Creates a new user account with the provided credentials. The password
   * will be hashed before storage for security.
   *
   * @param {UserDTO} dto - User information containing id and password
   * @returns {Promise<void>} No return value on success
   * @throws {UserError} When user already exists or registration fails
   * @example
   * ```typescript
   * await authService.register({
   *   id: "newuser",
   *   password: "newpassword123"
   * });
   * // New user account created
   * ```
   */
  @HandleAuthErrors()
  async register(dto: UserDTO): Promise<void> {
    await this.usersRepo.createUser(dto);
  }
}
