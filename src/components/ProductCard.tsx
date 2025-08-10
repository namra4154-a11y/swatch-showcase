import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: Props) {
  const pathInBucket = product.image_path.startsWith("product-images/")
    ? product.image_path.replace(/^product-images\//, "")
    : product.image_path;
  const resolvedUrl = product.image_path.startsWith("http")
    ? product.image_path
    : supabase.storage.from("product-images").getPublicUrl(pathInBucket).data.publicUrl;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden">
          <img
            src={resolvedUrl}
            alt={`${product.name} – design ${product.design_no}`}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </div>
        <div className="p-3 grid gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium leading-none truncate" title={product.name}>{product.name}</h3>
            <Badge variant="secondary">{product.design_no}</Badge>
          </div>
          <div className="text-sm text-muted-foreground truncate">{product.fabric_supplier || "—"}</div>
          <div className="text-sm font-semibold">₹ {Number(product.product_rate_inr).toFixed(2)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
