import { requireUser } from "@/lib/auth/require-user";
import { CsvImport } from "@/components/holdings/csv-import";

export default async function ImportPage() {
  await requireUser();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Import holdings</h2>
        <p className="text-muted-foreground text-sm">
          Bulk-add positions from a CSV export. Existing holdings with the same
          instrument &amp; source are updated, not duplicated.
        </p>
      </div>
      <CsvImport />
    </div>
  );
}
