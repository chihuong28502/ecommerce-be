import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as morgan from 'morgan';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/Interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Thêm TransformInterceptor global
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  const config = new DocumentBuilder()
    .setTitle('Store example')
    .setDescription('The Store API description')
    .setVersion('1.0')
    .addTag('Store')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  app.use(cookieParser());
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.use(morgan('dev'));

  app.use(helmet());

  await app.listen(configService.get<string>('PORT', '1001'));

  console.log(
    `    - Listen BACKEND:
    - PORT: ${configService.get<string>('PORT', '1001')} 
    - CONNECTDB: ${configService.get<string>('MONGODB_URI', 'localhost:27017').slice(0, 90)} 
    - ENV: ${configService.get<string>('NODE_ENV', 'dev')}`,
  );
}
bootstrap();