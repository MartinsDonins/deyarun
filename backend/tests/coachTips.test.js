import request from 'supertest';
import express from 'express';
import coachTipsRouter from '../routes/coachTips.js';

const app = express();
app.use(express.json());
app.use('/coach-tips', coachTipsRouter);

describe('GET /coach-tips/daily', () => {
  it('returns a daily tip', async () => {
    const res = await request(app).get('/coach-tips/daily');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('title');
  });
});
