function buildPoolConfig(env = {}) {
  const config = env.DATABASE_URL
    ? { connectionString: env.DATABASE_URL }
    : {
        host: env.PG_HOST || 'localhost',
        user: env.PG_USER || 'postgres',
        password: env.PG_PASSWORD,
        database: env.PG_NAME || 'ai_literacy_db',
        port: env.PG_PORT || 5432,
      };

  if (env.DB_SSL === 'true') {
    config.ssl = {
      rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    };
  }

  config.max = Number(env.DB_POOL_MAX) || 10;
  config.connectionTimeoutMillis = 5000;

  return config;
}

module.exports = { buildPoolConfig };
