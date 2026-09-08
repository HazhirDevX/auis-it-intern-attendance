import {
  AddInternForm,
  InternTable,
} from "@/components/admin/intern-management";
import { PageHeader } from "@/components/portal/page-header";
import { getAllSemesters, getInternProgress, getInterns } from "@/data/portal";
import { requireAdmin } from "@/lib/auth/dal";

export default async function InternsPage() {
  await requireAdmin();
  const [interns, semesters] = await Promise.all([
    getInterns(),
    getAllSemesters(),
  ]);
  const active = semesters.find((item) => item.status === "ACTIVE");
  const progress = active ? await getInternProgress(active.id) : [];
  const progressById = new Map(progress.map((item) => [item.id, item]));
  return (
    <>
      <PageHeader
        eyebrow="Access management"
        title="Authorized interns"
        description="Manage approved accounts, semester assignments, and access. Deactivate temporarily or permanently remove student access; history stays safe."
      />
      <details className="rounded-xl border bg-white p-5">
        <summary className="cursor-pointer py-2 font-semibold">
          Add an authorized intern
        </summary>
        <AddInternForm semesters={semesters} />
      </details>
      <InternTable
        interns={interns.map((intern) => ({
          ...intern,
          createdAt: intern.createdAt.toISOString(),
          deletedAt: intern.deletedAt?.toISOString() ?? null,
          progress: progressById.get(intern.id),
        }))}
      />
    </>
  );
}
