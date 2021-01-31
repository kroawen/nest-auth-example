import { fluse } from 'fluse';
import fakerPlugin from 'fluse-plugin-faker';
import typeormPlugin from 'fluse-plugin-typeorm';

import { Todo } from '../src/todo/todo.entity';
import { Profile } from '../src/user/profile.entity';
import { User } from '../src/user/user.entity';

const { fixture, combine, execute } = fluse({
  plugins: {
    orm: typeormPlugin({
      connection: 'default',
      synchronize: true,
      dropBeforeSync: true,
      transaction: true,
    }),
    faker: fakerPlugin(),
  },
});

export { execute, combine };

export const userFixture = fixture<User>({
  create({ orm, faker }) {
    const user = orm.entityManager.create(User, {
      name: faker.name.findName(),
      email: faker.internet.exampleEmail(),
      password: 'Pa$$w0rd',
    });

    return orm.entityManager.save(user);
  },
});

export const profileFixture = fixture<Profile, Pick<Profile, 'user'>>({
  create({ orm, faker }, { user }) {
    const profile = orm.entityManager.create(Profile, {
      phone: faker.phone.phoneNumber('(###) ###-#####'),
      birthday: faker.date.past(),
      website: faker.internet.url(),
      occupation: faker.name.jobTitle(),
      user,
    });

    return orm.entityManager.save(profile);
  },
});

export const todoFixture = fixture<Todo, Pick<Todo, 'owner'>>({
  create({ orm, faker }, { owner }) {
    const todo = orm.entityManager.create(Todo, {
      text: faker.lorem.sentence(),
      done: faker.random.boolean(),
      owner,
    });

    return orm.entityManager.save(todo);
  },
});
