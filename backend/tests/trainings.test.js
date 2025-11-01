import request from 'supertest';
import express from 'express';
import trainingsRouter from '../routes/trainings.js';

const app = express();
app.use(express.json());
app.use('/trainings', trainingsRouter);

describe('GET /trainings/plan', () => {
  it('returns training plan object', async () => {
    const res = await request(app).get('/trainings/plan');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name');
  });
});

describe('POST /trainings/create', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/trainings/create');
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /trainings/:id/complete', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/trainings/123/complete');
    expect(res.statusCode).toBe(401);
  });
});
