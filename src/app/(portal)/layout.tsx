import { PortalShell } from "@/components/portal/portal-shell";
import { requireUser } from "@/lib/auth/dal";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <PortalShell user={user}>{children}</PortalShell>;
}
