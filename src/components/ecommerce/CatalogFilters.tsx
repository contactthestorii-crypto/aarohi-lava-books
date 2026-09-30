import Link from "next/link";
import { Checkbox, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SORT_OPTIONS, type SortOption } from "@/services/catalog";
import type { Category } from "@/types";

export interface FilterValues {
  exam?: string;
  language?: string;
  sort?: SortOption;
  inStock?: boolean;
  min?: string;
  max?: string;
}

/**
 * Plain GET form: works without JavaScript and keeps filters in the URL (shareable,
 * crawlable). Used by /books and /categories/[slug].
 */
export function CatalogFilters({
  action,
  values,
  exams,
  languages,
  hideExam = false,
}: {
  action: string;
  values: FilterValues;
  exams: Category[];
  languages: string[];
  hideExam?: boolean;
}) {
  return (
    <form action={action} method="get" className="grid gap-4 rounded-[var(--radius-card)] border border-line p-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sort" className="text-sm font-semibold">
          Sort by
        </label>
        <Select id="sort" name="sort" defaultValue={values.sort ?? "featured"}>
          {Object.entries(SORT_OPTIONS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      {!hideExam && exams.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="exam" className="text-sm font-semibold">
            Exam
          </label>
          <Select id="exam" name="exam" defaultValue={values.exam ?? ""}>
            <option value="">All exams</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.name}>
                {exam.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      {languages.length > 1 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="language" className="text-sm font-semibold">
            Language
          </label>
          <Select id="language" name="language" defaultValue={values.language ?? ""}>
            <option value="">Any language</option>
            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">Price (₹)</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor="min">
            Minimum price
          </label>
          <input id="min" name="min" inputMode="numeric" placeholder="Min" defaultValue={values.min} className="h-11 rounded-[var(--radius-control)] border border-line px-3 text-[15px]" />
          <label className="sr-only" htmlFor="max">
            Maximum price
          </label>
          <input id="max" name="max" inputMode="numeric" placeholder="Max" defaultValue={values.max} className="h-11 rounded-[var(--radius-control)] border border-line px-3 text-[15px]" />
        </div>
      </fieldset>
      <Checkbox name="inStock" value="1" defaultChecked={values.inStock} label="In stock only" />
      <div className="flex gap-2">
        <Button type="submit" variant="dark" className="flex-1">
          Apply
        </Button>
        <Link href={action} className="inline-flex h-11 items-center px-3 text-sm font-semibold text-navy-700 hover:underline">
          Reset
        </Link>
      </div>
    </form>
  );
}
