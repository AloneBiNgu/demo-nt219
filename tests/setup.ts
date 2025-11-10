process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-change-me-please-123456';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-change-me-please-123456';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MINUTES = '15';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'ChangeMe!23456';

export {};
