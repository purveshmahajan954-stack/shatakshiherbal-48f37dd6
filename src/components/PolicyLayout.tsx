import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReactNode } from "react";

export function PolicyLayout({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="bg-cream/30 min-h-screen">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="font-display text-4xl sm:text-5xl text-dark-hero">{title}</h1>
          {updated && <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>}
          <div className="mt-8 prose prose-neutral max-w-none text-foreground/85 leading-relaxed space-y-5 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-dark-hero [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-primary [&_a]:underline">
            {children}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
