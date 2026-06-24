import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'access_fallback_secret_32chars!',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret_32chars!',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
}));
