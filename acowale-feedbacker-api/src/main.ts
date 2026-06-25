import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const corsOrigin = configService.get<string>('app.corsOrigin') || 'http://localhost:5173';
  const cookieSecret = configService.get<string>('app.cookieSecret');
  const nodeEnv = configService.get<string>('app.nodeEnv');

  // ─── Logger ─────────────────────────────────────────────────────
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // ─── Security ───────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ─── CORS ───────────────────────────────────────────────────────
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
  });

  // ─── Cookie Parser ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(cookieParser(cookieSecret));

  // ─── Global Prefix ──────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix);

  // ─── Global Pipes ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  // ─── Global Filters ─────────────────────────────────────────────
  const httpExceptionFilter = app.get(HttpExceptionFilter);
  app.useGlobalFilters(httpExceptionFilter);

  // ─── Global Interceptors ────────────────────────────────────────
  app.useGlobalInterceptors(
    app.get(LoggingInterceptor),
    new ResponseInterceptor(),
  );

  // ─── Swagger ────────────────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Acowale Feedbacker API')
      .setDescription(
        'Production-grade Feedback Management System API\n\n' +
        '**Demo Credentials:** admin@acowale.com / Admin@123',
      )
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Categories', 'Feedback categories')
      .addTag('Feedback', 'Feedback submission and management')
      .addTag('Analytics', 'Analytics and reporting')
      .addTag('Health', 'Health check')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/${apiPrefix}`);
  console.log(`🏥 Health check: http://localhost:${port}/${apiPrefix}/health`);
}

bootstrap();
