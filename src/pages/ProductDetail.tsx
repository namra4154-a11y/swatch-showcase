import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductByDesignNo, getRelatedBySupplier, Product } from "@/lib/products";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
export default function ProductDetailPage() {
  const { design_no } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = product ? `${product.name} – ${product.design_no}` : `Product – Swatch Showcase`;
  }, [product]);

  useEffect(() => {
    async function run() {
      if (!design_no) return;
      setLoading(true);
      try {
        const p = await getProductByDesignNo(design_no);
        setProduct(p);
        if (p?.fabric_supplier) {
          const r = await getRelatedBySupplier(p.fabric_supplier, p.design_no);
          setRelated(r);
        } else {
          setRelated([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [design_no]);

  if (loading) return <div className="container py-10">Loading...</div>;
  if (!product) return <div className="container py-10">Product not found.</div>;

  return (
    <main className="container py-6 grid gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-0">
            <div className="aspect-square overflow-hidden">
              {(() => {
                const pathInBucket = product.image_path.startsWith("product-images/")
                  ? product.image_path.replace(/^product-images\//, "")
                  : product.image_path;
                const resolvedUrl = product.image_path.startsWith("http")
                  ? product.image_path
                  : supabase.storage.from("product-images").getPublicUrl(pathInBucket).data.publicUrl;
                return (
                  <img
                    src={resolvedUrl}
                    alt={`${product.name} – design ${product.design_no}`}
                    className="h-full w-full object-cover"
                  />
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
              <div className="mt-1 text-muted-foreground">{product.fabric_name || "—"}</div>
            </div>
            <Badge variant="secondary">{product.design_no}</Badge>
          </div>

          <div className="text-2xl font-semibold">₹ {Number(product.product_rate_inr).toFixed(2)}</div>

          <Separator />

          <div className="grid gap-2 text-sm">
            <div>Fabric supplier: <span className="text-foreground/80">{product.fabric_supplier || "—"}</span></div>
            <div>Fabric name: <span className="text-foreground/80">{product.fabric_name || "—"}</span></div>
            <div>Fabric rate: <span className="text-foreground/80">{product.fabric_rate_inr ?? "—"}</span></div>
            <div>Panno (inch): <span className="text-foreground/80">{product.panno_inch ?? "—"}</span></div>
            <div>Matching: <span className="text-foreground/80">{product.matching || "—"}</span></div>
            <div>Matching rate: <span className="text-foreground/80">{product.matching_fabric_rate_inr ?? "—"}</span></div>
            <div>Matching Panno (inch): <span className="text-foreground/80">{product.matching_fabric_panno_inch ?? "—"}</span></div>
            <div>Tags: <span className="text-foreground/80">{product.tags?.join(", ") || "—"}</span></div>
          </div>

          <div className="pt-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="grid gap-4">
          <h2 className="text-xl font-semibold">Related products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/products/${encodeURIComponent(p.design_no)}`)} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
