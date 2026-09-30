"use client";

import { ArrowDown, ArrowUp, Trash } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";
import { deleteBookImageAction, moveBookImageAction, uploadBookImagesAction } from "@/actions/admin/books";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { initialActionState } from "@/lib/action-result";
import type { ProductImage } from "@/types";

export function BookImages({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const toast = useToast();
  const [state, action, uploading] = useActionState(uploadBookImagesAction, initialActionState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) toast.show(result.error ?? "Failed", "error");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {images.length === 0 ? <p className="text-sm text-muted">No images yet. The first image is used as the cover.</p> : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li key={image.id} className="rounded-[var(--radius-control)] border border-line p-2">
            <div className="relative aspect-[3/4] overflow-hidden rounded bg-navy-50">
              <Image src={image.url} alt={image.alt ?? ""} fill sizes="200px" className="object-contain" />
              {index === 0 ? <span className="absolute left-1 top-1 rounded bg-navy-900 px-1.5 py-0.5 text-[11px] font-bold text-white">Cover</span> : null}
            </div>
            <div className="mt-2 flex justify-between">
              <div className="flex gap-1">
                <button type="button" aria-label="Move earlier" disabled={pending || index === 0} onClick={() => run(() => moveBookImageAction(image.id, "up"))} className="rounded p-1.5 hover:bg-navy-50 disabled:opacity-30">
                  <ArrowUp size={16} />
                </button>
                <button type="button" aria-label="Move later" disabled={pending || index === images.length - 1} onClick={() => run(() => moveBookImageAction(image.id, "down"))} className="rounded p-1.5 hover:bg-navy-50 disabled:opacity-30">
                  <ArrowDown size={16} />
                </button>
              </div>
              <button
                type="button"
                aria-label="Delete image"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Delete this image?")) run(() => deleteBookImageAction(image.id));
                }}
                className="rounded p-1.5 text-danger hover:bg-red-50"
              >
                <Trash size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="productId" value={productId} />
        <input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple className="text-sm file:mr-3 file:rounded-[var(--radius-control)] file:border file:border-line file:bg-white file:px-3 file:py-2 file:font-semibold" />
        <Button type="submit" variant="dark" loading={uploading}>
          Upload
        </Button>
        <p className="w-full text-xs text-muted">JPEG, PNG or WebP up to 5 MB each. Images are resized and converted to WebP.</p>
      </form>
      {!state.ok && state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok && state.message ? <Notice tone="success">{state.message}</Notice> : null}
    </div>
  );
}
