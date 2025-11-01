import request from 'supertest';
import express from 'express';
import leaderboardRouter from '../routes/leaderboard.js';

const app = express();
app.use('/leaderboard', leaderboardRouter);

describe('GET /leaderboard/weekly', () => {
  it('returns weekly leaderboard list', async () => {
    const res = await request(app).get('/leaderboard/weekly');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
