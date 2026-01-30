import * as Yup from "yup";

export const validationSchema = Yup.object().shape({
  name: Yup.string().required("Enter your name"),
  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: Yup.string().required("Enter your password"),
});
