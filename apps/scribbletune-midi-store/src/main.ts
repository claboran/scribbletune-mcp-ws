import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Scribbletune MIDI Store')
    .setDescription('Store and retrieve MIDI clips via Valkey')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(document), {
    customSiteTitle: 'Scribbletune MIDI Store API',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    raw: ['json', 'yaml'],
    jsonDocumentUrl: '/api-json',
    yamlDocumentUrl: '/api-yaml',
  });

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
  Logger.log(`MIDI store running on: http://localhost:${port}`);
  Logger.log(`Swagger UI: http://localhost:${port}/api`);
}

bootstrap();
