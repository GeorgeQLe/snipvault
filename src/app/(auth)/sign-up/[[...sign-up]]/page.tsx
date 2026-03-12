import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            cardBox: 'shadow-2xl',
          },
        }}
      />
    </div>
  );
}
