import SignupForm from '@/components/SignupForm/SignupForm';
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
