import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../domain/identity.ports';

const SALT_ROUNDS = 12;

export const bcryptPasswordHasher: PasswordHasher = {
  hash: (plain) => bcrypt.hash(plain, SALT_ROUNDS),
  verify: (plain, hash) => bcrypt.compare(plain, hash),
};
