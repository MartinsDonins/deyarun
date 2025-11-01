import request from 'supertest';
import express from 'express';
import notificationsRouter from '../routes/notifications.js';

const app = express();
app.use(express.json());
app.use('/notifications', notificationsRouter);

describe('POST /notifications/subscribe', () => {
  it('requires token field', async () => {
    const res = await request(app).post('/notifications/subscribe');
    expect(res.statusCode).toBe(400);
  });
});
