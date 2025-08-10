import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { exportProductsXLSXWithImageFormula } from "@/lib/products";

export default function ExportPage() {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onExport = async () => {
    setDownloading(true);
    setError(null);
    try {
      const blob = await exportProductsXLSXWithImageFormula();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export products');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="container py-8 max-w-2xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Export Products</h1>
        </div>

        {/* Export Card */}
        <Card className="border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <FileSpreadsheet className="h-6 w-6" />
              Export to Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Button 
                onClick={onExport} 
                disabled={downloading} 
                size="lg"
                variant="default"
                className="h-12 px-8 text-lg font-medium"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>

            {downloaded && (
              <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                <span className="font-medium">
                  Products exported successfully!
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="font-medium">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
