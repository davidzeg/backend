import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => {
  // Debug
  console.log('Database Configuration:');
  console.log('🔍 Database Config:');
  console.log('  Host:', process.env.DB_HOST || 'localhost');
  console.log('  Port:', process.env.DB_PORT || '5432');
  console.log('  User:', process.env.DB_USER || 'postgres');
  console.log(
    '  Password:',
    process.env.DB_PASSWORD
      ? '***' + process.env.DB_PASSWORD.slice(-3)
      : 'NOT SET',
  );
  console.log('  Database:', process.env.DB_NAME || 'mydatabase');

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'mydatabase',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    extra: {
      max: 30,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  };
};
