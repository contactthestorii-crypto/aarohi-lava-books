"use client";

import { Printer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button variant="dark" icon={<Printer size={18} />} onClick={() => window.print()}>
      Print or save as PDF
    </Button>
  );
}
