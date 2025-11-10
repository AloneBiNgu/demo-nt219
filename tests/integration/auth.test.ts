import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../../src/config/database';
import { UserModel } from '../../src/models/user.model';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await connectToDatabase();
});

afterAll(async () => {
  await disconnectFromDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
});

describe('Auth API', () => {
  it('registers and logs in a user', async () => {
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user@example.com',
        password: 'StrongPass!1234'
      })
      .expect(201);

    expect(registerResponse.body.status).toBe('success');
    expect(registerResponse.body.data.tokens.accessToken).toBeDefined();
    expect(registerResponse.headers['set-cookie']).toBeDefined();

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'StrongPass!1234'
      })
      .expect(200);

    const accessToken = loginResponse.body.data.tokens.accessToken as string;
    expect(accessToken).toBeDefined();

    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
