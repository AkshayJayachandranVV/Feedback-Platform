/**
 * generate-api-docs.ts
 *
 * Bootstraps the NestJS application (without listening on a port), generates
 * the full OpenAPI / Swagger document, and writes it to:
 *   - api-docs.json  — machine-readable JSON spec
 *   - api-docs.yaml  — human-readable YAML spec (requires js-yaml if present)
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/generate-api-docs.ts
 *
 * Or add to package.json scripts:
 *   "docs:generate": "ts-node -r tsconfig-paths/register src/scripts/generate-api-docs.ts"
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../app.module';

async function generateDocs() {
  // Bootstrap app without HTTP adapter
  const app = await NestFactory.create(AppModule, { logger: false });

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Build the Swagger document ────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Acowale Feedbacker API')
    .setDescription(
      'Production-grade Feedback Management System REST API.\n\n' +
      '## Authentication\n' +
      'All admin endpoints require a valid JWT cookie (`access_token`).\n' +
      'Login via `POST /auth/login` and the cookie is set automatically.\n\n' +
      '## Pagination\n' +
      'List endpoints use **cursor-based pagination**. Pass `cursor` (the `id` of the last\n' +
      'returned document) to advance pages. The response includes `nextCursor` and `hasNextPage`.\n\n' +
      '**Demo Credentials:** `admin@acowale.com` / `Admin@123`',
    )
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .addTag('Auth', 'Authentication — login, logout, refresh')
    .addTag('Categories', 'Feedback category management (admin)')
    .addTag('Feedback', 'Feedback submission and admin management')
    .addTag('Analytics', 'Dashboard analytics and reporting (admin)')
    .addTag('Health', 'Service health monitoring')
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);

  // ── Write JSON ────────────────────────────────────────────────────────────
  const outDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, 'api-docs.json');
  fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2), 'utf8');
  console.log(`✅  OpenAPI JSON written to: ${jsonPath}`);

  // ── Optionally write YAML (if js-yaml is available) ──────────────────────
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const yaml = require('js-yaml');
    const yamlPath = path.join(outDir, 'api-docs.yaml');
    fs.writeFileSync(yamlPath, yaml.dump(document, { lineWidth: 120 }), 'utf8');
    console.log(`✅  OpenAPI YAML written to: ${yamlPath}`);
  } catch {
    console.log('ℹ️  js-yaml not found — YAML output skipped (JSON only).');
  }

  await app.close();
  console.log('\n📚  Import api-docs.json into Postman, Insomnia, or any OpenAPI viewer.');
}

generateDocs().catch((err) => {
  console.error('❌  Failed to generate API docs:', err);
  process.exit(1);
});
