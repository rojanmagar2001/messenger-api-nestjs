import { NestFactory } from '@nestjs/core';
import { PresenceModule } from './presence.module';
import { ConfigService } from '@nestjs/config';
import { SharedService } from '@app/shared';

async function bootstrap() {
  const app = await NestFactory.create(PresenceModule);
  const configService = app.get(ConfigService);

  const QUEUE = configService.get('RABBITMQ_PRESENCE_QUEUE');
  const sharedService = app.get(SharedService);

  app.connectMicroservice(sharedService.getRmqOptions(QUEUE));

  app.startAllMicroservices();
}
bootstrap();
