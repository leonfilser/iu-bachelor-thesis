import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'http://localhost',
      'http://127.0.0.1',
      'http://152.53.132.106:8000'
    ]
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
