import {
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

type JwtPayload = { sub: string; email: string; role: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async login(loginDto: LoginDto, res: Response) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn('Login failed - user not found', { email });
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn('Login failed - wrong password', { email });
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } = this.generateTokens(payload);

    // Hash and store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

    // Set HttpOnly cookies
    this.setTokenCookies(res, accessToken, refreshToken);

    this.logger.info('User logged in', { userId: user.id, email });

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  async refreshTokens(userId: string, res: Response) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const { accessToken, refreshToken } = this.generateTokens(payload);

    // Rotate refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

    this.setTokenCookies(res, accessToken, refreshToken);

    this.logger.info('Tokens refreshed', { userId: user.id });

    return {
      success: true,
      message: 'Tokens refreshed',
      data: { user: { id: user.id, email: user.email, role: user.role } },
    };
  }

  async logout(token: string | null, res: Response) {
    let userId: string | null = null;
    if (token) {
      try {
        const accessSecret = this.configService.get<string>('jwt.accessSecret') as string;
        const payload = this.jwtService.verify(token, {
          secret: accessSecret,
          ignoreExpiration: true,
        }) as JwtPayload;
        userId = payload?.sub || null;
      } catch (err: any) {
        this.logger.warn('Failed to verify token on logout', { error: err.message });
      }
    }

    if (userId) {
      await this.usersService.updateRefreshToken(userId, null);
      this.logger.info('User logged out', { userId });
    } else {
      this.logger.info('Anonymous/Expired logout - clearing cookies');
    }
    this.clearTokenCookies(res);
    return { success: true, message: 'Logged out successfully' };
  }

  private generateTokens(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    const accessSecret = this.configService.get<string>('jwt.accessSecret') as string;
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret') as string;
    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn') as string;
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') as string;

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn as never,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as never,
    });

    return { accessToken, refreshToken };
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true, // Required for cross-site cookies
      sameSite: 'none', // Required for cross-site cookies (Vercel -> Render)
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/v1/auth/refresh'
    });
  }
}
