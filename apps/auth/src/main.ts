import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';

import { SharedService } from '@app/shared';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const configService = app.get(ConfigService);

  const QUEUE = configService.get('RABBITMQ_AUTH_QUEUE');
  const sharedService = app.get(SharedService);

  app.connectMicroservice(sharedService.getRmqOptions(QUEUE));

  app.startAllMicroservices();
}
bootstrap();
