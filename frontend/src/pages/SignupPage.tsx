import { useNavigate } from "react-router-dom";
import { SignupForm } from "@/components/opensourceui/signup-form";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "./AuthLayout";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  return (
    <AuthLayout>
      <SignupForm
        onSubmit={async ({ email, password }) => {
          await signup(email, password);
          navigate("/", { replace: true });
        }}
      />
    </AuthLayout>
  );
}
