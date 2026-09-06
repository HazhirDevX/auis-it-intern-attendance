import {
  CreateSemesterForm,
  SemesterCards,
} from "@/components/admin/semester-management";
import { PageHeader } from "@/components/portal/page-header";
import { getAllSemesters, getInterns } from "@/data/portal";
import { requireAdmin } from "@/lib/auth/dal";

export default async function SemestersPage() {
  await requireAdmin();
  const [semesters, interns] = await Promise.all([
    getAllSemesters(),
    getInterns(),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Internship periods"
        title="Semester management"
        description="Start each cohort at zero while keeping every historical activity intact."
      />
      <SemesterCards semesters={semesters} />
      <details className="mt-6 rounded-xl border bg-white p-5">
        <summary className="cursor-pointer py-2 font-semibold">
          Create a new semester
        </summary>
        <CreateSemesterForm
          interns={interns
            .filter((item) => item.active && item.role === "STUDENT")
            .map(({ id, name, email }) => ({ id, name, email }))}
        />
      </details>
    </>
  );
}
