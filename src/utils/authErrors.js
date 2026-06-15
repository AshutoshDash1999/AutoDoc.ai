const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const NETWORK_ERROR_MESSAGE = 'Unable to reach the server. Check your connection and try again.';
const SERVER_ERROR_MESSAGE = 'We could not complete that request right now. Please try again later.';

const pickErrorMessage = (data) => {
  if (!data) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  if (Array.isArray(data.errors)) {
    const firstError = data.errors.find(Boolean);
    if (typeof firstError === 'string') {
      return firstError;
    }
    if (typeof firstError?.message === 'string') {
      return firstError.message;
    }
    if (typeof firstError?.msg === 'string') {
      return firstError.msg;
    }
  }

  if (data.errors && typeof data.errors === 'object') {
    const firstError = Object.values(data.errors).flat().find(Boolean);
    if (typeof firstError === 'string') {
      return firstError;
    }
    if (typeof firstError?.message === 'string') {
      return firstError.message;
    }
  }

  return '';
};

export const getAuthErrorMessage = (error, fallbackMessage = DEFAULT_ERROR_MESSAGE) => {
  if (!error?.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const status = error.response.status;
  if (status >= 500) {
    return SERVER_ERROR_MESSAGE;
  }

  const message = pickErrorMessage(error.response.data).trim();
  return message || fallbackMessage;
};

export const authErrorMessages = {
  network: NETWORK_ERROR_MESSAGE,
  server: SERVER_ERROR_MESSAGE,
};
