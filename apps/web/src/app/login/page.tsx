import { AuthBrandLogo } from '@/components/auth/auth-brand-logo';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5">
        <AuthBrandLogo />
        <LoginForm />
      </div>
    </div>
  );
}
