import Image from "next/image";
import Link from "next/link";

type LegalPageProps = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-[#17283b] sm:py-16">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border bg-white shadow-sm">
        <header className="border-b bg-[#071d37] px-6 py-8 text-white sm:px-10">
          <Link href="/" aria-label="Return to the portal sign-in page">
            <Image
              src="/auis-logo.png"
              alt="American University of Iraq, Sulaimani"
              width={424}
              height={112}
              className="h-auto w-44"
            />
          </Link>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-300">Last updated: {updated}</p>
        </header>
        <div className="space-y-8 px-6 py-8 text-sm leading-7 text-slate-700 sm:px-10 sm:py-10">
          {children}
        </div>
        <footer className="flex flex-wrap gap-x-5 gap-y-2 border-t bg-slate-50 px-6 py-5 text-sm sm:px-10">
          <Link className="font-medium text-[#0b2545] underline-offset-4 hover:underline" href="/">
            Portal home
          </Link>
          <Link className="font-medium text-[#0b2545] underline-offset-4 hover:underline" href="/privacy">
            Privacy
          </Link>
          <Link className="font-medium text-[#0b2545] underline-offset-4 hover:underline" href="/terms">
            Terms
          </Link>
        </footer>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[#0b2545]">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
