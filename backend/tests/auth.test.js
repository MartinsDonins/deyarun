import request from 'supertest';
import express from 'express';
import authRouter from '../routes/auth.js';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('POST /auth/register', () => {
  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({ firstName: 'A', lastName: 'B' });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /auth/reset-password', () => {
  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/auth/reset-password').send({ email: 'test@example.com' });
    expect(res.statusCode).toBe(400);
  });
});
