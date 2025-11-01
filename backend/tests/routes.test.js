import request from 'supertest';
import express from 'express';
import routesRouter from '../routes/routes.js';

const app = express();
app.use(express.json());
app.use('/routes', routesRouter);

describe('GET /routes/my', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/routes/my');
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /routes/save', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/routes/save');
    expect(res.statusCode).toBe(401);
  });
});
