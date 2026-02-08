import * as Yup from 'yup';

export const validationSchema = Yup.object({
  name: Yup.string().required('Enter your name'),

  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),

  phone: Yup.string().required('Phone Number is required'),

  password: Yup.string()
    .required('Enter your password')
    .min(6, 'Password must be at least 6 characters'),

  password_confirmation: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords do not match'),
});
