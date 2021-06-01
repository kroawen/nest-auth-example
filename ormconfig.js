module.exports = {
  name: 'default',
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  synchronize: true,
  password: 'LRB@dmin999',
  database: 'auth_test',
  entities: [
    process.env.NODE_ENV === 'test'
      ? 'src/**/*.entity.ts'
      : 'dist/**/*.entity.js',
  ],
  migrations: ['dist/migrations/*.js'],
  cli: {
    migrationsDir: 'src/migrations',
  },
  synchronize: true,
  extra: {
    ssl:
      process.env.SSL_MODE === 'require'
        ? {
            rejectUnauthorized: false,
          }
        : false,
  },
};
