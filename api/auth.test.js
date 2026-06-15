import { describe, expect, it } from 'vitest';
import { getRegisterValidationMessage } from './utils/authValidation';

describe('auth register validation', () => {
  it('requires a name', () => {
    expect(getRegisterValidationMessage({ name: '', email: 'user@example.com', password: 'secret' })).toBe('Name is required.');
  });

  it('requires a valid email address', () => {
    expect(getRegisterValidationMessage({ name: 'User', email: 'invalid', password: 'secret' })).toBe('Enter a valid email address.');
  });

  it('requires a password', () => {
    expect(getRegisterValidationMessage({ name: 'User', email: 'user@example.com', password: '' })).toBe('Password is required.');
  });

  it('accepts valid signup input', () => {
    expect(getRegisterValidationMessage({ name: 'User', email: 'user@example.com', password: 'secret' })).toBe('');
  });
});
