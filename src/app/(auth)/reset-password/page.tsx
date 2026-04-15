import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <span className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
