import { useEffect, useState } from "react";
import { exportProductsCSV } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ExportPage() {
  const [downloading, setDownloading] = useState(false);
  useEffect(() => { document.title = "Export – Swatch Showcase"; }, []);

  const onDownload = async () => {
    try {
      setDownloading(true);
      const csv = await exportProductsCSV();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="container py-6 grid gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Export Database</h1>
      <p className="text-muted-foreground">Download all products as CSV for backup or analysis.</p>
      <div>
        <Button onClick={onDownload} disabled={downloading}>{downloading ? "Preparing..." : "Download CSV"}</Button>
      </div>
      <Separator />
      <section className="text-sm text-muted-foreground">
        <p>Alternative (via Supabase Dashboard): Table Editor → products → three dots → Export/Download CSV.</p>
      </section>
    </main>
  );
}
