import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../models/repositories/Database';

describe('Health & Auth Integration', () => {
    it('should return health status ok', async () => {
        const res = await request('http://localhost:3001').get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    it('should deny access to restricted routes without token', async () => {
        const res = await request('http://localhost:3001').get('/api/patients');
        expect(res.status).toBe(401);
    });
});
