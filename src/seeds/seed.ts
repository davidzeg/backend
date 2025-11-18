import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { UsersService } from 'src/users/users.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);

  await usersService.create({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  });

  console.log('Seeding complete.');
  await app.close();
}

seed();
