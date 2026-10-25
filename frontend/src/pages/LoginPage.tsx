import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/opensourceui/login-form";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "./AuthLayout";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  return (
    <AuthLayout>
      <LoginForm
        subtitle="Sign in to see your spending."
        onSubmit={async ({ email, password }) => {
          await login(email, password);
          navigate("/", { replace: true });
        }}
      />
    </AuthLayout>
  );
}
