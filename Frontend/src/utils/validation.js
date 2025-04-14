// src/utils/validation.js
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from './constants';


export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


export const isValidPassword = (password) => {
  return password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);
};


export const validateFile = (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Invalid file type. Only JPG, PNG, and WEBP allowed.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File size exceeds the 2MB limit.";
  }
  return null;
};
