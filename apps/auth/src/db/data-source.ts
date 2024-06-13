import { DataSource, DataSourceOptions } from 'typeorm';
import { UserEntity } from '../user.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.POSTGRES_URI,
  entities: [UserEntity],
  migrations: ['dist/apps/auth/db/migrations/*.js'],
  //   autoLoadEntities: true,
  //   synchronize: true, // Don't use this in production - otherwise you can lose data
};

export const dataSource = new DataSource(dataSourceOptions);
