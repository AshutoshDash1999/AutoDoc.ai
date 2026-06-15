import { describe, expect, it } from 'vitest';
import { authErrorMessages, getAuthErrorMessage } from './authErrors';

describe('getAuthErrorMessage', () => {
  it('returns server validation messages for client errors', () => {
    const error = {
      response: {
        status: 400,
        data: { message: 'Enter a valid email address.' },
      },
    };

    expect(getAuthErrorMessage(error, 'Signup failed. Please try again.')).toBe('Enter a valid email address.');
  });

  it('returns the first validation error from array responses', () => {
    const error = {
      response: {
        status: 422,
        data: { errors: [{ message: 'Password is required.' }] },
      },
    };

    expect(getAuthErrorMessage(error, 'Signup failed. Please try again.')).toBe('Password is required.');
  });

  it('returns a clear network fallback when no response is available', () => {
    expect(getAuthErrorMessage({ request: {} }, 'Signup failed. Please try again.')).toBe(authErrorMessages.network);
  });

  it('does not display server error response bodies', () => {
    const error = {
      response: {
        status: 500,
        data: { message: 'MongoServerError: connection failed' },
      },
    };

    expect(getAuthErrorMessage(error, 'Signup failed. Please try again.')).toBe(authErrorMessages.server);
  });
});
