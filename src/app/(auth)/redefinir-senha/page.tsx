import { Suspense } from "react";
import { ResetForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
