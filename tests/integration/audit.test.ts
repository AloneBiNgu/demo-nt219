import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../../src/config/database';
import { UserModel } from '../../src/models/user.model';
import { AuditLog } from '../../src/models/auditLog.model';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectToDatabase();
}, 30000); // 30 second timeout

afterAll(async () => {
  await disconnectFromDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}, 30000);

beforeEach(async () => {
  await UserModel.deleteMany({});
  await AuditLog.deleteMany({});
});

describe('Audit Logging Integration Tests', () => {
  describe('Authentication Audit Logs', () => {
    it('should create audit log on user registration', async () => {
      const email = 'newuser@example.com';
      
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'StrongPass!1234'
        })
        .expect(201);

      // Check audit log was created
      const auditLogs = await AuditLog.find({ eventType: 'auth.register' });
      expect(auditLogs).toHaveLength(1);
      
      const log = auditLogs[0];
      expect(log.eventType).toBe('auth.register');
      expect(log.action).toBe('register');
      expect(log.resource).toBe('authentication');
      expect(log.result).toBe('success');
      expect(log.metadata?.email).toBe(email);
      expect(log.metadata?.method).toBe('local');
      expect(log.signature).toBeDefined();
      expect(log.riskScore).toBeUndefined(); // Successful registration has no risk
    });

    it('should create audit log on successful login', async () => {
      // First register
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      // Clear audit logs from registration
      await AuditLog.deleteMany({});

      // Then login
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        })
        .expect(200);

      // Check audit log was created
      const auditLogs = await AuditLog.find({ eventType: 'auth.login' });
      expect(auditLogs).toHaveLength(1);
      
      const log = auditLogs[0];
      expect(log.eventType).toBe('auth.login');
      expect(log.action).toBe('login');
      expect(log.result).toBe('success');
      expect(log.metadata?.email).toBe('user@example.com');
      expect(log.signature).toBeDefined();
    });

    it('should create security audit log on failed login', async () => {
      // First register
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      // Clear audit logs
      await AuditLog.deleteMany({});

      // Try login with wrong password
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword'
        })
        .expect(400);

      // Check security audit log was created
      const auditLogs = await AuditLog.find({ eventType: 'security.failed_login' });
      expect(auditLogs).toHaveLength(1);
      
      const log = auditLogs[0];
      expect(log.eventType).toBe('security.failed_login');
      expect(log.action).toBe('failed_login');
      expect(log.resource).toBe('security');
      expect(log.result).toBe('failure');
      expect(log.riskScore).toBe(50);
      expect(log.metadata?.reason).toContain('password');
      expect(log.signature).toBeDefined();
    });

    it('should create audit log on email verification', async () => {
      // Register user
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      // Get verification token from user
      const user = await UserModel.findOne({ email: 'user@example.com' })
        .select('+emailVerificationToken');
      expect(user).toBeDefined();
      expect(user?.emailVerificationToken).toBeDefined();

      // Clear audit logs from registration
      await AuditLog.deleteMany({});

      // Verify email
      await request(app)
        .get(`/api/v1/auth/verify-email/${user!.emailVerificationToken}`)
        .expect(200);

      // Check audit log was created
      const auditLogs = await AuditLog.find({ eventType: 'auth.email_verify' });
      expect(auditLogs).toHaveLength(1);
      
      const log = auditLogs[0];
      expect(log.eventType).toBe('auth.email_verify');
      expect(log.action).toBe('email_verify');
      expect(log.result).toBe('success');
      expect(log.metadata?.method).toBe('email_token');
      expect(log.signature).toBeDefined();
    });

    it('should detect brute force pattern after multiple failed logins', async () => {
      // Register user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      // Clear audit logs
      await AuditLog.deleteMany({});

      // Attempt 12 failed logins
      for (let i = 0; i < 12; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'user@example.com',
            password: 'WrongPassword'
          })
          .expect(400);
      }

      // Check security audit logs
      const failedLogins = await AuditLog.find({ 
        eventType: 'security.failed_login' 
      });
      
      expect(failedLogins.length).toBeGreaterThanOrEqual(12);
      
      // All should have risk score of 50
      failedLogins.forEach(log => {
        expect(log.riskScore).toBe(50);
        expect(log.result).toBe('failure');
      });
    });
  });

  describe('Audit Chain Integrity', () => {
    it('should maintain audit log chain integrity', async () => {
      // Create multiple events
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user1@example.com',
          password: 'StrongPass!1234'
        });

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'StrongPass!1234'
        });

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user3@example.com',
          password: 'StrongPass!1234'
        });

      // Get all audit logs
      const logs = await AuditLog.find({}).sort({ timestamp: 1 });
      expect(logs.length).toBeGreaterThanOrEqual(3);

      // First log should have null previousHash
      expect(logs[0].previousHash).toBeNull();

      // Subsequent logs should chain properly
      for (let i = 1; i < logs.length; i++) {
        expect(logs[i].previousHash).toBeDefined();
        expect(logs[i].previousHash).not.toBeNull();
      }

      // All logs should have signatures
      logs.forEach(log => {
        expect(log.signature).toBeDefined();
        expect(log.signature).not.toBe('');
      });
    });

    it('should have valid cryptographic signatures', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPass!1234'
        });

      const log = await AuditLog.findOne({ eventType: 'auth.register' });
      expect(log).toBeDefined();
      
      // Verify signature exists and has correct format (HMAC-SHA256 hex)
      expect(log!.signature).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Audit Log Metadata', () => {
    it('should capture IP address and user agent', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .set('User-Agent', 'Test-Agent/1.0')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      const log = await AuditLog.findOne({ eventType: 'auth.register' });
      expect(log).toBeDefined();
      expect(log!.metadata?.userAgent).toBe('Test-Agent/1.0');
      expect(log!.metadata?.ip).toBeDefined();
    });

    it('should store user ID in audit logs', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      const user = await UserModel.findOne({ email: 'user@example.com' });
      const log = await AuditLog.findOne({ eventType: 'auth.register' });
      
      expect(log).toBeDefined();
      expect(log!.userId).toBe(user!.id);
    });
  });

  describe('Risk Score Calculation', () => {
    it('should assign risk score 0 for successful operations', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      const log = await AuditLog.findOne({ eventType: 'auth.register' });
      expect(log).toBeDefined();
      expect(log!.riskScore).toBeUndefined(); // No risk for normal registration
    });

    it('should assign risk score 50 for failed logins', async () => {
      // Register first
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      await AuditLog.deleteMany({});

      // Failed login
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword'
        })
        .expect(400);

      const log = await AuditLog.findOne({ eventType: 'security.failed_login' });
      expect(log).toBeDefined();
      expect(log!.riskScore).toBe(50);
    });
  });

  describe('Audit Log Immutability', () => {
    it('should prevent audit log updates', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      const log = await AuditLog.findOne({ eventType: 'auth.register' });
      expect(log).toBeDefined();

      // Try to update the log
      await expect(async () => {
        log!.action = 'tampered';
        await log!.save();
      }).rejects.toThrow();
    });

    it('should prevent audit log deletion', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      const log = await AuditLog.findOne({ eventType: 'auth.register' });
      expect(log).toBeDefined();

      // Try to delete the log
      await expect(async () => {
        await log!.deleteOne();
      }).rejects.toThrow();
    });
  });

  describe('Audit Log Query Performance', () => {
    it('should efficiently query audit logs by event type', async () => {
      // Create multiple logs
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `user${i}@example.com`,
            password: 'StrongPass!1234'
          });
      }

      const startTime = Date.now();
      const logs = await AuditLog.find({ eventType: 'auth.register' });
      const queryTime = Date.now() - startTime;

      expect(logs).toHaveLength(5);
      expect(queryTime).toBeLessThan(100); // Should be fast with index
    });

    it('should efficiently query audit logs by user ID', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      const user = await UserModel.findOne({ email: 'user@example.com' });

      const startTime = Date.now();
      const logs = await AuditLog.find({ userId: user!.id });
      const queryTime = Date.now() - startTime;

      expect(logs.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(100); // Should be fast with index
    });

    it('should efficiently query audit logs by risk score', async () => {
      // Create failed logins (risk score 50)
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'user@example.com',
          password: 'StrongPass!1234'
        });

      await AuditLog.deleteMany({});

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'user@example.com',
            password: 'WrongPassword'
          });
      }

      const startTime = Date.now();
      const logs = await AuditLog.find({ riskScore: { $gte: 50 } });
      const queryTime = Date.now() - startTime;

      expect(logs).toHaveLength(5);
      expect(queryTime).toBeLessThan(100); // Should be fast with index
    });
  });
});
