import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { requireEnvironmentValue } from '../config/environment';

dotenv.config();

export default new DataSource({
  type: 'mysql',
  host: requireEnvironmentValue('DB_HOST'),
  port: Number(requireEnvironmentValue('DB_PORT')),
  username: requireEnvironmentValue('DB_USERNAME'),
  password: requireEnvironmentValue('DB_PASSWORD'),
  database: requireEnvironmentValue('DB_DATABASE'),
  entities: [resolve(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [resolve(__dirname, 'migrations/*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
});
