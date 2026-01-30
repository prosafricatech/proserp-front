import { SignupForm } from '@/components/signupForm';
import { Div } from '@jumbo/shared';

export default function Signup() {
  return (
    <Div
      sx={{
        maxWidth: '100%',
        margin: 'auto',
        p: 1,
      }}
    >
      <SignupForm />
    </Div>
  );
}
