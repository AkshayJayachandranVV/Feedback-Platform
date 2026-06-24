import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret') as string,
      passReqToCallback: true as const,
    };
    super(options);
  }

  async validate(req: Request, payload: { sub: string; email: string }) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied');
    }

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
