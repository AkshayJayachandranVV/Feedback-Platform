import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import throttlerConfig from './config/throttler.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ─── Config ──────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, throttlerConfig],
      envFilePath: '.env',
    }),

    // ─── Winston Logger ──────────────────────────────────────────
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logDir = config.get<string>('app.nodeEnv') === 'production'
          ? path.join(process.cwd(), 'logs')
          : path.join(process.cwd(), 'logs');
        const logLevel = config.get<string>('LOG_LEVEL') || 'info';

        return {
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                  return `[${timestamp}] ${level}: ${message}${metaStr}`;
                }),
              ),
            }),
            new winston.transports.File({
              filename: path.join(logDir, 'error.log'),
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
            new winston.transports.File({
              filename: path.join(logDir, 'combined.log'),
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
          ],
        };
      },
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
      }),
    }),

    // ─── Rate Limiting ────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttler.ttl') ?? 60000,
            limit: config.get<number>('throttler.limit') ?? 10,
          },
        ],
      }),
    }),

    // ─── Feature Modules ─────────────────────────────────────────
    AuthModule,
    UsersModule,
    CategoriesModule,
    FeedbackModule,
    AnalyticsModule,
    HealthModule,
  ],
  providers: [HttpExceptionFilter, LoggingInterceptor],
})
export class AppModule {}
