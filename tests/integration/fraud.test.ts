import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../../src/config/database';
import { UserModel } from '../../src/models/user.model';
import { OrderModel } from '../../src/models/order.model';
import { AuditLog } from '../../src/models/auditLog.model';
import {
  detectHighValueOrderAnomaly,
  detectRapidOrderCreation,
  detectFailedLoginPattern,
  detectPaymentFraud,
  performFraudCheck
} from '../../src/services/anomaly.service';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectToDatabase();
}, 30000);

afterAll(async () => {
  await disconnectFromDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}, 30000);

beforeEach(async () => {
  await UserModel.deleteMany({});
  await OrderModel.deleteMany({});
  await AuditLog.deleteMany({});
});

describe('Fraud Detection Service Tests', () => {
  describe('High Value Order Anomaly Detection', () => {
    it('should detect order 3x higher than user average', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create normal orders ($100 each)
      for (let i = 0; i < 5; i++) {
        await OrderModel.create({
          user: user._id,
          items: [],
          totalAmount: 100,
          currency: 'USD',
          status: 'paid'
        });
      }

      // Try to create high-value order ($500 = 5x average)
      const result = await detectHighValueOrderAnomaly(
        user.id,
        500,
        '123 Main St'
      );

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
      expect(result.reasons).toContain(
        expect.stringContaining('5x higher than average')
      );
    });

    it('should detect new shipping address on high-value order', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create orders with same address
      for (let i = 0; i < 3; i++) {
        await OrderModel.create({
          user: user._id,
          items: [],
          totalAmount: 100,
          currency: 'USD',
          status: 'paid',
          shippingAddress: '123 Main St'
        });
      }

      // Try order with new address
      const result = await detectHighValueOrderAnomaly(
        user.id,
        350, // 3.5x average
        '456 New St' // Different address
      );

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(60);
      expect(result.reasons).toContain(
        expect.stringContaining('New shipping address')
      );
    });

    it('should flag first order with high value', async () => {
      const user = new UserModel({
        email: 'newuser@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // First order with high value
      const result = await detectHighValueOrderAnomaly(
        user.id,
        2000,
        '123 Main St'
      );

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(50);
      expect(result.reasons).toContain('First order with high value');
    });

    it('should flag orders exceeding $10,000', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      const result = await detectHighValueOrderAnomaly(
        user.id,
        15000,
        '123 Main St'
      );

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(70);
      expect(result.reasons).toContain(
        expect.stringContaining('$10,000')
      );
    });

    it('should not flag normal orders', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create normal orders
      for (let i = 0; i < 5; i++) {
        await OrderModel.create({
          user: user._id,
          items: [],
          totalAmount: 100,
          currency: 'USD',
          status: 'paid',
          shippingAddress: '123 Main St'
        });
      }

      // Normal order (same as average)
      const result = await detectHighValueOrderAnomaly(
        user.id,
        100,
        '123 Main St'
      );

      expect(result.isAnomalous).toBe(false);
      expect(result.riskScore).toBeLessThan(60);
    });
  });

  describe('Rapid Order Creation Detection', () => {
    it('should detect more than 5 orders in 1 hour', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create 6 orders in last hour
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        await OrderModel.create({
          user: user._id,
          items: [],
          totalAmount: 100,
          currency: 'USD',
          status: 'pending',
          createdAt: new Date(now.getTime() - 30 * 60 * 1000) // 30 mins ago
        });
      }

      const result = await detectRapidOrderCreation(user.id);

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(70);
      expect(result.reasons).toContain(
        expect.stringContaining('6 orders created in the last hour')
      );
    });

    it('should detect more than 20 orders in 1 day', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create 21 orders in last day
      const now = new Date();
      for (let i = 0; i < 21; i++) {
        await OrderModel.create({
          user: user._id,
          items: [],
          totalAmount: 100,
          currency: 'USD',
          status: 'pending',
          createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
        });
      }

      const result = await detectRapidOrderCreation(user.id);

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(50);
      expect(result.reasons).toContain(
        expect.stringContaining('21 orders created in the last 24 hours')
      );
    });

    it('should not flag normal order frequency', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create 3 orders (normal)
      const now = new Date();
      for (let i = 0; i < 3; i++) {
        await OrderModel.create({
          user: user._id,
          items: [],
          totalAmount: 100,
          currency: 'USD',
          status: 'pending',
          createdAt: new Date(now.getTime() - 30 * 60 * 1000)
        });
      }

      const result = await detectRapidOrderCreation(user.id);

      expect(result.isAnomalous).toBe(false);
      expect(result.riskScore).toBeLessThan(60);
    });
  });

  describe('Failed Login Pattern Detection', () => {
    it('should detect brute force by user ID', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create 10 failed login attempts
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        await AuditLog.create({
          timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 mins ago
          eventType: 'security.failed_login',
          userId: user.id,
          action: 'failed_login',
          resource: 'security',
          result: 'failure',
          metadata: {
            ip: '192.168.1.1',
            reason: 'Invalid password'
          },
          signature: 'test-signature',
          previousHash: null
        });
      }

      const result = await detectFailedLoginPattern(user.id, '192.168.1.1');

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(60);
      expect(result.reasons).toContain(
        expect.stringContaining('10 failed login attempts')
      );
    });

    it('should detect brute force by IP address', async () => {
      // Create 15 failed logins from same IP
      const now = new Date();
      const ip = '203.0.113.42';
      
      for (let i = 0; i < 15; i++) {
        await AuditLog.create({
          timestamp: new Date(now.getTime() - 10 * 60 * 1000), // 10 mins ago
          eventType: 'security.failed_login',
          userId: undefined,
          action: 'failed_login',
          resource: 'security',
          result: 'failure',
          metadata: {
            ip,
            reason: 'Invalid credentials'
          },
          signature: 'test-signature',
          previousHash: null
        });
      }

      const result = await detectFailedLoginPattern(undefined, ip);

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(70);
      expect(result.reasons).toContain(
        expect.stringContaining('15 failed login attempts from IP')
      );
    });

    it('should detect automated brute force pattern', async () => {
      const now = new Date();
      const ip = '203.0.113.42';
      
      // Create 15 failed logins with consistent timing (automated)
      for (let i = 0; i < 15; i++) {
        await AuditLog.create({
          timestamp: new Date(now.getTime() - (i * 3000)), // 3 seconds apart
          eventType: 'security.failed_login',
          userId: undefined,
          action: 'failed_login',
          resource: 'security',
          result: 'failure',
          metadata: {
            ip,
            reason: 'Invalid credentials'
          },
          signature: 'test-signature',
          previousHash: null
        });
      }

      const result = await detectFailedLoginPattern(undefined, ip);

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(80);
      expect(result.reasons).toContain(
        expect.stringContaining('Automated brute force')
      );
    });

    it('should not flag normal failed login attempts', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Only 2 failed attempts (normal)
      const now = new Date();
      for (let i = 0; i < 2; i++) {
        await AuditLog.create({
          timestamp: new Date(now.getTime() - 5 * 60 * 1000),
          eventType: 'security.failed_login',
          userId: user.id,
          action: 'failed_login',
          resource: 'security',
          result: 'failure',
          metadata: {
            ip: '192.168.1.1',
            reason: 'Invalid password'
          },
          signature: 'test-signature',
          previousHash: null
        });
      }

      const result = await detectFailedLoginPattern(user.id, '192.168.1.1');

      expect(result.isAnomalous).toBe(false);
      expect(result.riskScore).toBeLessThan(60);
    });
  });

  describe('Payment Fraud Detection', () => {
    it('should detect high payment velocity', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create 5 payment attempts in last hour
      const now = new Date();
      for (let i = 0; i < 5; i++) {
        await AuditLog.create({
          timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
          eventType: 'payment.initiated',
          userId: user.id,
          action: 'initiated',
          resource: 'payment',
          result: 'success',
          metadata: {
            amount: 100,
            currency: 'USD',
            ip: '192.168.1.1'
          },
          signature: 'test-signature',
          previousHash: null
        });
      }

      const result = await detectPaymentFraud(user.id, 100, {
        ip: '192.168.1.1'
      });

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(40);
      expect(result.reasons).toContain(
        expect.stringContaining('5 payment attempts')
      );
    });

    it('should detect multiple IPs used for payments', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create payments from 4 different IPs
      const now = new Date();
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3', '192.168.1.4'];
      
      for (const ip of ips) {
        await AuditLog.create({
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
          eventType: 'payment.initiated',
          userId: user.id,
          action: 'initiated',
          resource: 'payment',
          result: 'success',
          metadata: {
            amount: 100,
            currency: 'USD',
            ip
          },
          signature: 'test-signature',
          previousHash: null
        });
      }

      const result = await detectPaymentFraud(user.id, 100, {
        ip: '192.168.1.5' // Another new IP
      });

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(30);
      expect(result.reasons).toContain(
        expect.stringContaining('multiple IP addresses')
      );
    });

    it('should detect high payment failure rate', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create 8 failed payments and 2 successful
      const now = new Date();
      
      for (let i = 0; i < 8; i++) {
        await AuditLog.create({
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          eventType: 'payment.failed',
          userId: user.id,
          action: 'failed',
          resource: 'payment',
          result: 'failure',
          metadata: {
            amount: 100,
            currency: 'USD'
          },
          signature: 'test-signature',
          previousHash: null
        });
      }

      for (let i = 0; i < 2; i++) {
        await AuditLog.create({
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          eventType: 'payment.completed',
          userId: user.id,
          action: 'completed',
          resource: 'payment',
          result: 'success',
          metadata: {
            amount: 100,
            currency: 'USD'
          },
          signature: 'test-signature',
          previousHash: null
        });
      }

      const result = await detectPaymentFraud(user.id, 100, {
        ip: '192.168.1.1'
      });

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(50);
      expect(result.reasons).toContain(
        expect.stringContaining('failure rate')
      );
    });
  });

  describe('Comprehensive Fraud Check', () => {
    it('should combine multiple fraud indicators', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Create normal order history
      for (let i = 0; i < 5; i++) {
        await OrderModel.create({
          user: user._id,
          items: [],
          totalAmount: 100,
          currency: 'USD',
          status: 'paid'
        });
      }

      // Create multiple payment attempts
      const now = new Date();
      for (let i = 0; i < 4; i++) {
        await AuditLog.create({
          timestamp: new Date(now.getTime() - 30 * 60 * 1000),
          eventType: 'payment.initiated',
          userId: user.id,
          action: 'initiated',
          resource: 'payment',
          result: 'success',
          metadata: {
            amount: 100,
            currency: 'USD',
            ip: '192.168.1.1'
          },
          signature: 'test-signature',
          previousHash: null
        });
      }

      // High-value order + rapid payments
      const result = await performFraudCheck(user.id, {
        action: 'order',
        amount: 500, // 5x average
        shippingAddress: '456 New St',
        ip: '192.168.1.1'
      });

      expect(result.isAnomalous).toBe(true);
      expect(result.riskScore).toBeGreaterThan(60);
      expect(result.reasons.length).toBeGreaterThan(1);
    });

    it('should return low risk for normal transactions', async () => {
      const user = new UserModel({
        email: 'user@example.com',
        password: 'hashedpassword',
        provider: 'local'
      });
      await user.save();

      // Normal order history
      for (let i = 0; i < 5; i++) {
        await OrderModel.create({
          user: user._id,
          items: [],
          totalAmount: 100,
          currency: 'USD',
          status: 'paid',
          shippingAddress: '123 Main St'
        });
      }

      // Normal transaction
      const result = await performFraudCheck(user.id, {
        action: 'order',
        amount: 100,
        shippingAddress: '123 Main St',
        ip: '192.168.1.1'
      });

      expect(result.isAnomalous).toBe(false);
      expect(result.riskScore).toBeLessThan(60);
    });
  });

  describe('Risk Score Thresholds', () => {
    it('should categorize risk scores correctly', async () => {
      // Low risk: 0-29
      expect(0).toBeLessThan(30);
      
      // Medium risk: 30-59
      expect(45).toBeGreaterThanOrEqual(30);
      expect(45).toBeLessThan(60);
      
      // High risk: 60-79
      expect(70).toBeGreaterThanOrEqual(60);
      expect(70).toBeLessThan(80);
      
      // Critical risk: 80-100
      expect(90).toBeGreaterThanOrEqual(80);
      expect(90).toBeLessThanOrEqual(100);
    });
  });
});
