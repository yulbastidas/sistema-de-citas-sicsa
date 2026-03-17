import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1230809075',
      database: 'sicsa',
      autoLoadEntities: true,
      synchronize: true,
    }),
     UsersModule, 
  ],
})
export class AppModule {}