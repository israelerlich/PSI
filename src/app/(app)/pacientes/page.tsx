import { requireUser } from "@/lib/auth-helpers";
import { listPatients } from "@/server/queries/patient";
import { PatientList } from "./_components/PatientList";

export const dynamic = "force-dynamic";

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const patients = await listPatients(user.id, { search: q });

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <PatientList patients={patients} initialSearch={q} />
    </div>
  );
}
