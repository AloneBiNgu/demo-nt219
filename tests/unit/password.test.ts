import { comparePassword, hashPassword } from '../../src/utils/password';

describe('password utilities', () => {
  it('hashes and compares passwords correctly', async () => {
    const password = 'StrongPass!1234';
    const hash = await hashPassword(password);

    expect(hash).not.toEqual(password);
    await expect(comparePassword(password, hash)).resolves.toBe(true);
    await expect(comparePassword('wrongPassword123!', hash)).resolves.toBe(false);
  });
});
