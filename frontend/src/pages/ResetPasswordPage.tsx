import { Link, useSearchParams } from "react-router-dom";
import { ResetPasswordForm } from "@/components/opensourceui/reset-password-form";
import { api } from "@/lib/api";
import { AuthLayout } from "./AuthLayout";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  return (
    <AuthLayout>
      {token ? (
        <ResetPasswordForm
          onSubmit={async (password) => {
            await api("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, new_password: password }) });
          }}
        />
      ) : (
        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Link is incomplete</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-500">Open the link from your email again, or request a new one.</p>
          <Link to="/forgot-password" className="mt-6 inline-block text-sm font-medium text-neutral-900 underline underline-offset-2">Request a new link</Link>
        </div>
      )}
    </AuthLayout>
  );
}
