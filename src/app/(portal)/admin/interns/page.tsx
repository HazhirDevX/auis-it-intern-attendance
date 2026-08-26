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
        description="Only people on this list can pass the second authentication gate."
      />
      <AddInternForm semesters={semesters} />
      <InternTable
        interns={interns.map((intern) => ({
          ...intern,
          createdAt: intern.createdAt.toISOString(),
          progress: progressById.get(intern.id),
        }))}
      />
    </>
  );
}
