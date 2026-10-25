import { ForgotPasswordForm } from "@/components/opensourceui/forgot-password-form";
import { api } from "@/lib/api";
import { AuthLayout } from "./AuthLayout";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm
        successMessage="If an account exists for that email, a reset link is on its way. It's valid for 30 minutes."
        onSubmit={async (email) => {
          await api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
        }}
      />
    </AuthLayout>
  );
}
