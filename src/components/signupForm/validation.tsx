import * as yup from 'yup';

export const validationSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Full name is required')
    .max(191, 'Full name is too long'),

  email: yup
    .string()
    .trim()
    .email('Enter a valid email address')
    .required('Email is required'),

  phone: yup
    .string()
    .trim()
    .required('Phone number is required')
    .matches(
      /^\+?[0-9]{10,15}$/,
      'Phone number must be between 10 and 15 digits'
    ),

  password: yup
    .string()
    .required('Password is required')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{8,})/,
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
    ),

  password_confirmation: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});
