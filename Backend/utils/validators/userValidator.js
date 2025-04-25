export const validateUserInput = ({ firstname, lastname, email, password }) => {
  const errors = [];

  if (!firstname || !lastname || !email || !password) {
    errors.push("All fields are required");
  }

  if (firstname && !/^[a-zA-Z]+$/.test(firstname)) {
    errors.push("First name can only contain letters");
  }

  if (lastname && !/^[a-zA-Z]+$/.test(lastname)) {
    errors.push("Last name can only contain letters");
  }

  if (firstname && (firstname.length < 2 || firstname.length > 20)) {
    errors.push("First name must be between 2 and 20 characters");
  }

  if (lastname && (lastname.length < 2 || lastname.length > 20)) {
    errors.push("Last name must be between 2 and 20 characters");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format");
  }

  if (email && email.length > 50) {
    errors.push("Email must be less than 50 characters");
  }

  if (password && password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (password && password.length > 20) {
    errors.push("Password must be less than 20 characters");
  }

  return errors;
};
