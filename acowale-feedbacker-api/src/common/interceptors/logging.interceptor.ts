import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Attach correlation ID
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    request.headers['x-request-id'] = requestId;
    response.setHeader('x-request-id', requestId);

    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.info(`→ ${method} ${url}`, {
      requestId,
      ip,
      userAgent,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.info(`← ${method} ${url} ${response.statusCode} ${duration}ms`, {
            requestId,
            statusCode: response.statusCode,
            duration,
          });
        },
        error: (err: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`← ${method} ${url} ERROR ${duration}ms`, {
            requestId,
            duration,
            error: err.message,
          });
        },
      }),
    );
  }
}
