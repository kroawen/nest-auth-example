import { build, fake } from '@jackfranklin/test-data-bot';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as supertest from 'supertest';

import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { setup } from '../src/setup';
import { execute, profileFixture, userFixture } from './fixtures';

const updateBuilder = build({
  fields: {
    name: fake(f => f.name.findName()),
  },
});

describe('ProfileController (e2e)', () => {
  let app: INestApplication;
  let request: supertest.SuperTest<supertest.Test>;
  let token: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = setup(moduleFixture.createNestApplication());
    await app.init();

    request = supertest(app.getHttpServer());

    const { profile } = await execute(
      profileFixture('profile', { args: { user: userFixture.asArg() } }),
    );
    token = app.get(AuthService).signToken(profile.user);
    userId = profile.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should show the user profile', async () => {
    const { body } = await request
      .get(`/profile/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(body).not.toHaveProperty('password');
  });

  it('should fail to show user profile without authorization', async () => {
    const resp = await request
      .get(`/profile/${userId}`)
      .expect(HttpStatus.UNAUTHORIZED);

    expect(resp.body).toBeDefined();
  });

  it('should update the user profile', async () => {
    const { body } = await request
      .put(`/profile/${userId}`)
      .send(updateBuilder())
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(body).not.toHaveProperty('password');
  });

  it('should require the name when update profile', async () => {
    const resp = await request
      .put(`/profile/${userId}`)
      .send({ name: '' })
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(resp.body).toBeDefined();
  });

  it('should fail to update the profile without authorization', async () => {
    const resp = await request
      .put(`/profile/${userId}`)
      .send(updateBuilder())
      .expect(HttpStatus.UNAUTHORIZED);

    expect(resp.body).toBeDefined();
  });
});
