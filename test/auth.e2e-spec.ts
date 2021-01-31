import { build, fake } from '@jackfranklin/test-data-bot';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as faker from 'faker';
import * as supertest from 'supertest';

import { AppModule } from '../src/app.module';
import { setup } from '../src/setup';
import type { User } from '../src/user/user.entity';
import { execute, userFixture } from './fixtures';

const userBuilder = build({
  fields: {
    name: fake(f => f.name.findName()),
    email: fake(f => f.internet.exampleEmail()),
    password: 'Pa$$w0rd',
  },
});

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let request: supertest.SuperTest<supertest.Test>;
  let user: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = setup(moduleFixture.createNestApplication());

    await app.init();

    user = (await execute(userFixture('john'))).john;
    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['/auth/register', userBuilder(), HttpStatus.CREATED],
    [
      '/auth/register',
      { name: null, email: null, password: null },
      HttpStatus.UNPROCESSABLE_ENTITY,
    ],
    [
      '/auth/login',
      { email: faker.internet.email(), password: faker.internet.password() },
      HttpStatus.UNAUTHORIZED,
    ],
  ])(
    'should make a POST request to %s with %p and expect %d status',
    async (url, body, statusCode) => {
      const resp = await request.post(url).send(body).expect(statusCode);

      expect(resp.body).toBeDefined();
      expect(resp.body.password).toBeUndefined();
      if (resp.ok) expect(resp.header.authorization).toMatch(/Bearer\s+.*/);
    },
  );

  it('should login the user', async () => {
    const resp = await request
      .post('/auth/login')
      .send({ email: user.email, password: 'Pa$$w0rd' })
      .expect('Authorization', /Bearer\s+.*/)
      .expect(HttpStatus.OK);

    expect(resp.body).toBeDefined();
    expect(resp.body.password).toBeUndefined();
  });

  it('should fail to login with incorrect password', async () => {
    const resp = await request
      .post('/auth/login')
      .send({ email: user.email, password: faker.internet.password() })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(resp.body).toBeDefined();
  });

  it('should get session user', async () => {
    const {
      header: { authorization },
    } = await request
      .post('/auth/login')
      .send({
        email: user.email,
        password: 'Pa$$w0rd',
      })
      .expect(HttpStatus.OK);
    const resp = await request
      .get('/auth/me')
      .set('Authorization', authorization);

    expect(resp.body).toBeDefined();
    expect(resp.body.password).toBeUndefined();
  });
});
