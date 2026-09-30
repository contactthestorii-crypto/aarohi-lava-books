import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { RichText } from "./RichText";

export function ContentPage({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="container-page py-8 md:py-12">
      <Breadcrumbs items={[{ label: title }]} />
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
      <div className="mt-6">
        {text ? <RichText text={text} /> : null}
        {children}
      </div>
    </div>
  );
}
