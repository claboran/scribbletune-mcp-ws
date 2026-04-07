import { INestApplication, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import Redis from 'ioredis';
import request = require('supertest');
import { redisConfig } from '../config/redis.config';
import { ClipsModule } from './clips.module';
import { ClipsService, REDIS_CLIENT } from './clips.service';

// ─── shared container lifecycle ─────────────────────────────────────────────

let container: StartedRedisContainer;
let redis: Redis;

beforeAll(async () => {
  container = await new RedisContainer('valkey/valkey:8-alpine').start();
  redis = new Redis(container.getConnectionUrl());
}, 60_000);

afterAll(async () => {
  await redis.quit();
  await container.stop();
});

afterEach(async () => {
  // isolate every test with a clean store
  await redis.flushdb();
});

// ─── 1. ClipsService — storage logic ────────────────────────────────────────

describe('ClipsService (integration)', () => {
  let service: ClipsService;

  beforeEach(() => {
    const cfg = {
      url: container.getConnectionUrl(),
      ttlSeconds: 3600,
      publicUrl: 'http://localhost:3001',
    };
    service = new ClipsService(redis, cfg);
  });

  it('save returns a UUID-shaped id and the expected key format', async () => {
    const { id, key } = await service.save(Buffer.from('fake-midi'));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(key).toBe(`clips:${id}`);
  });

  it('fetchById retrieves the exact bytes that were saved', async () => {
    const original = Buffer.from('some-midi-bytes');
    const { id } = await service.save(original);
    const retrieved = await service.fetchById(id);
    expect(retrieved).toEqual(original);
  });

  it('fetchById throws NotFoundException for an unknown id', async () => {
    await expect(service.fetchById('does-not-exist')).rejects.toThrow(NotFoundException);
  });

  it('deleteById removes the clip — subsequent fetch throws', async () => {
    const { id } = await service.save(Buffer.from('to-delete'));
    await service.deleteById(id);
    await expect(service.fetchById(id)).rejects.toThrow(NotFoundException);
  });

  it('save stores key with correct TTL (within 2 s tolerance)', async () => {
    const customTtl = 7200;
    const { id } = await service.save(Buffer.from('ttl-check'), customTtl);
    const ttl = await redis.ttl(`clips:${id}`);
    expect(ttl).toBeGreaterThan(customTtl - 2);
    expect(ttl).toBeLessThanOrEqual(customTtl);
  });

  it('multiple clips are stored independently', async () => {
    const a = Buffer.from('clip-A');
    const b = Buffer.from('clip-B');
    const { id: idA } = await service.save(a);
    const { id: idB } = await service.save(b);
    expect(await service.fetchById(idA)).toEqual(a);
    expect(await service.fetchById(idB)).toEqual(b);
  });
});

// ─── 2. ClipsController — full HTTP layer ────────────────────────────────────

describe('ClipsController (HTTP integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env['REDIS_URL'] = container.getConnectionUrl();
    process.env['PUBLIC_URL'] = 'http://localhost:3001';

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [redisConfig] }),
        ClipsModule,
      ],
    })
      // override the REDIS_CLIENT with the shared test connection so the
      // same redis instance is flushed by afterEach above
      .overrideProvider(REDIS_CLIENT)
      .useValue(redis)
      .compile();

    app = module.createNestApplication();
    await app.init();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  it('POST /clips → 201 with key, downloadUrl and ttlSeconds', async () => {
    const buf = Buffer.from('fake-midi-http');
    await request(app.getHttpServer())
      .post('/clips')
      .attach('file', buf, { filename: 'clip.mid', contentType: 'audio/midi' })
      .expect(201)
      .expect((res) => {
        expect(res.body.key).toMatch(/^clips:/);
        expect(res.body.downloadUrl).toContain('/clips/');
        expect(typeof res.body.ttlSeconds).toBe('number');
        expect(res.body.ttlSeconds).toBeGreaterThan(0);
      });
  });

  it('GET /clips/:id → 200 with audio/midi content-type and original bytes', async () => {
    const buf = Buffer.from('midi-round-trip');
    const postRes = await request(app.getHttpServer())
      .post('/clips')
      .attach('file', buf, { filename: 'clip.mid', contentType: 'audio/midi' })
      .expect(201);

    const id = postRes.body.key.replace('clips:', '');
    await request(app.getHttpServer())
      .get(`/clips/${id}`)
      .responseType('arraybuffer')
      .expect(200)
      .expect('Content-Type', /audio\/midi/)
      .expect((res) => {
        expect(Buffer.from(res.body)).toEqual(buf);
      });
  });

  it('GET /clips/:id → 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/clips/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('DELETE /clips/:id → 204 then GET returns 404', async () => {
    const buf = Buffer.from('delete-me');
    const postRes = await request(app.getHttpServer())
      .post('/clips')
      .attach('file', buf, { filename: 'clip.mid', contentType: 'audio/midi' })
      .expect(201);

    const id = postRes.body.key.replace('clips:', '');

    await request(app.getHttpServer())
      .delete(`/clips/${id}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/clips/${id}`)
      .expect(404);
  });

  it('Content-Disposition header is set to attachment with filename clip.mid', async () => {
    const buf = Buffer.from('header-check');
    const postRes = await request(app.getHttpServer())
      .post('/clips')
      .attach('file', buf, { filename: 'clip.mid', contentType: 'audio/midi' })
      .expect(201);

    const id = postRes.body.key.replace('clips:', '');
    await request(app.getHttpServer())
      .get(`/clips/${id}`)
      .expect(200)
      .expect('Content-Disposition', /attachment.*clip\.mid/);
  });
});
