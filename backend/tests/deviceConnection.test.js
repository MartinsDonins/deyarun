import request from 'supertest';
import express from 'express';
import userRouter from '../routes/user.js';

const app = express();
app.use(express.json());
app.use('/user', userRouter);

describe('POST /user/connect-device', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/user/connect-device');
    expect(res.statusCode).toBe(401);
  });
});
