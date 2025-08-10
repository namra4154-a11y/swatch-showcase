import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  product: Product;
  onClick?: () => void;
  viewMode?: "grid" | "list";
}

export function ProductCard({ product, onClick, viewMode = "grid" }: Props) {
  // Construct the correct Supabase storage URL
  const resolvedUrl = (() => {
    if (product.image_path.startsWith("http")) {
      return product.image_path;
    }
    
    // Remove "product-images/" prefix if it exists
    const cleanPath = product.image_path.replace(/^product-images\//, '');
    
    // Debug logging
    console.log('ProductCard - Original image_path:', product.image_path);
    console.log('ProductCard - Cleaned path:', cleanPath);
    
    return supabase.storage.from("product-images").getPublicUrl(cleanPath).data.publicUrl;
  })();

  if (viewMode === "list") {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 hover:border-border" onClick={onClick}>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 overflow-hidden rounded-lg flex-shrink-0 ring-1 ring-border/50 group-hover:ring-2 group-hover:ring-primary/20 transition-all relative">
              <img
                src={resolvedUrl}
                alt={`${product.name} – design ${product.design_no}`}
                loading="lazy"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg leading-tight truncate" title={product.name}>
                  {product.name}
                </h3>
                <Badge variant="secondary" className="font-mono text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20">
                  {product.design_no}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {product.fabric_supplier || "—"}
              </div>
              {product.fabric_name && (
                <div className="text-sm text-muted-foreground mb-3">
                  {product.fabric_name}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                  Design: {product.design_no}
                </Badge>
                {product.category && (
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {product.category}
                  </Badge>
                )}
                {product.tags && product.tags.length > 0 && product.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {product.tags && product.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{product.tags.length - 2}
                  </Badge>
                )}
              </div>
              <div className="text-xl font-bold text-primary">₹ {Number(product.product_rate_inr).toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 hover:border-border overflow-hidden" onClick={onClick}>
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden relative">
          <img
            src={resolvedUrl}
            alt={`${product.name} – design ${product.design_no}`}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </div>
        <div className="p-4 grid gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight truncate flex-1" title={product.name}>{product.name}</h3>
            <Badge variant="secondary" className="font-mono text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20 flex-shrink-0">
              {product.design_no}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground truncate">{product.fabric_supplier || "—"}</div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
              Design: {product.design_no}
            </Badge>
            {product.category && (
              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {product.category}
              </Badge>
            )}
            {product.tags && product.tags.length > 0 && product.tags.slice(0, 1).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {product.tags && product.tags.length > 1 && (
              <Badge variant="outline" className="text-xs">
                +{product.tags.length - 1}
              </Badge>
            )}
          </div>
          <div className="text-lg font-bold text-primary">₹ {Number(product.product_rate_inr).toFixed(2)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
