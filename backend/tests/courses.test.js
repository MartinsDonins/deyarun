import request from 'supertest';
import express from 'express';
import coursesRouter from '../routes/courses.js';

const app = express();
app.use(express.json());
app.use('/courses', coursesRouter);

describe('GET /courses', () => {
  it('returns list of courses', async () => {
    const res = await request(app).get('/courses');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toContain('5km');
  });
});
