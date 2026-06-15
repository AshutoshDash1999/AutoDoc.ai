const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getRegisterValidationMessage = ({ name, email, password }) => {
  if (!name || !name.trim()) {
    return "Name is required.";
  }

  if (!email || !email.trim()) {
    return "Email is required.";
  }

  if (!emailPattern.test(email.trim())) {
    return "Enter a valid email address.";
  }

  if (!password) {
    return "Password is required.";
  }

  return "";
};
