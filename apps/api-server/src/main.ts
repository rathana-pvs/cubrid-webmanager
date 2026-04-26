import { loadRuntimeEnv } from './config/load-runtime-env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'module-alias/register';
import { getHttpsOptions } from '@util';
import { GlobalExceptionFilter } from '@error/global-filter';
import { ConfigService } from '@config/config.service';
import { SuccessResponseInterceptor, LoggingInterceptor } from '@common'; // Updated import

async function bootstrap() {
  loadRuntimeEnv();
  const httpsOptions = getHttpsOptions();
  const app = await NestFactory.create(AppModule, { httpsOptions });
  const configService = app.get(ConfigService);
  const port: string = configService.getPort();
  const allowedOrigins = configService.getAllowedOrigins();
  console.log('[main.ts] Allowed Origins from ConfigService:', allowedOrigins);

  if (allowedOrigins.includes('*')) {
    console.log('[main.ts] Enabling CORS for all origins.');
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
    });
  } else {
    // Allow all origins starting with localhost
    const whitelist = [...allowedOrigins];
    console.log('[main.ts] Production CORS whitelist:', whitelist);
    app.enableCors({
      origin: (origin, callback) => {
        console.log('[main.ts] Received Origin header:', origin);
        // Allow if origin is not present (same-origin requests, etc.)
        if (!origin) {
          callback(null, true);
          return;
        }
        // Allow all origins starting with localhost
        if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
          callback(null, true);
          return;
        }
        // Allow origins in whitelist
        if (whitelist.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
    });
  }

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new SuccessResponseInterceptor());
  await app.listen(port);
  console.log('\t@ server running port :', port);
}
bootstrap();
