import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductByDesignNo, getRelatedBySupplier, deleteProduct, Product } from "@/lib/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Tag, Package, DollarSign, Ruler, Info, Image as ImageIcon, X, ZoomIn, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProductDetailPage() {
  const { design_no } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    document.title = product ? `${product.name} – ${product.design_no}` : `Product – Sheth's `;
  }, [product]);

  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleResetZoom = () => {
    setImageZoom(1);
  };

  const handleDelete = async () => {
    if (!product) return;
    
    try {
      await deleteProduct(product.design_no);
      toast({ title: "Product deleted", description: `Design ${product.design_no} has been deleted successfully.` });
      navigate("/products");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to delete product", description: e.message });
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!imageModalOpen) return;
    
    if (e.key === 'Escape') {
      e.preventDefault();
      setImageModalOpen(false);
      setImageZoom(1);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      handleZoomIn();
    } else if (e.key === '-') {
      e.preventDefault();
      handleZoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      handleResetZoom();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imageModalOpen]);

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

  if (loading) {
    return (
      <div className="container py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-square bg-muted rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-10">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Product not found</h1>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/products")}>Back to Catalog</Button>
        </div>
      </div>
    );
  }

  const resolvedUrl = (() => {
    if (product.image_path.startsWith("http")) {
      return product.image_path;
    }
    
    // Remove "product-images/" prefix if it exists
    const cleanPath = product.image_path.replace(/^product-images\//, '');
    
    // Debug logging
    console.log('ProductDetail - Original image_path:', product.image_path);
    console.log('ProductDetail - Cleaned path:', cleanPath);
    
    return supabase.storage.from("product-images").getPublicUrl(cleanPath).data.publicUrl;
  })();

  return (
    <main className="container py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-8 px-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <span>/</span>
        <span>Products</span>
        <span>/</span>
        <span className="text-foreground font-medium">{product.design_no}</span>
      </div>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-0">
            <div className="aspect-square overflow-hidden relative group cursor-pointer" onClick={() => setImageModalOpen(true)}>
              <img
                src={resolvedUrl}
                alt={`${product.name} – design ${product.design_no}`}
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {/* Overlay with zoom icon */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-3">
                  <ZoomIn className="h-6 w-6 text-gray-700" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Info Section */}
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                <div className="text-lg text-muted-foreground">{product.fabric_name || "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-lg px-4 py-2 bg-primary/10 text-primary border-primary/20">
                  {product.design_no}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-primary">₹ {Number(product.product_rate_inr).toFixed(2)}</div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/products/${encodeURIComponent(product.design_no)}/edit`)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the product
                        "{product.name}" (Design {product.design_no}) and remove it from the database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete Product
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Package className="h-4 w-4" />
                  Supplier
                </div>
                <div className="font-medium">{product.fabric_supplier || "—"}</div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Tag className="h-4 w-4" />
                  Design No.
                </div>
                <div className="font-medium">{product.design_no}</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Specifications */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5" />
                Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Fabric Rate
                  </div>
                  <div className="font-medium">₹ {product.fabric_rate_inr?.toFixed(2) || "—"}</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ruler className="h-4 w-4" />
                    Panno (inch)
                  </div>
                  <div className="font-medium">{product.panno_inch || "—"}</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Matching
                  </div>
                  <div className="font-medium">{product.matching || "—"}</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Matching Rate
                  </div>
                  <div className="font-medium">₹ {product.matching_fabric_rate_inr?.toFixed(2) || "—"}</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ruler className="h-4 w-4" />
                    Matching Panno
                  </div>
                  <div className="font-medium">{product.matching_fabric_panno_inch || "—"}</div>
                </div>
              </div>
              
              {product.tags && product.tags.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Tag className="h-4 w-4" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                      Design: {product.design_no}
                    </Badge>
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Related Products</h2>
            <Button variant="outline" onClick={() => navigate("/products")}>
              View All Products
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/products/${encodeURIComponent(p.design_no)}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Image Modal */}
      {imageModalOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => {
            setImageModalOpen(false);
            setImageZoom(1);
          }}
        >
          <div className="relative w-full h-full max-w-6xl max-h-full flex items-center justify-center">
            {/* Zoom Controls */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-colors h-8 w-8 sm:h-9 sm:w-9 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                disabled={imageZoom <= 0.5}
              >
                <span className="text-sm sm:text-lg font-bold">−</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-colors h-8 w-8 sm:h-9 sm:w-9 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetZoom();
                }}
              >
                <span className="text-xs sm:text-sm">100%</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-colors h-8 w-8 sm:h-9 sm:w-9 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                disabled={imageZoom >= 3}
              >
                <span className="text-sm sm:text-lg font-bold">+</span>
              </Button>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-colors h-8 w-8 sm:h-9 sm:w-9 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setImageModalOpen(false);
                setImageZoom(1);
              }}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            {/* Image Container with Scroll */}
            <div className="w-full h-full overflow-auto flex items-center justify-center p-2 sm:p-4">
              <div 
                className="relative flex items-center justify-center"
                style={{
                  transform: `scale(${imageZoom})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease-out'
                }}
              >
                <img
                  src={resolvedUrl}
                  alt={`${product.name} – design ${product.design_no}`}
                  className="max-w-full max-h-full object-contain select-none"
                  style={{
                    cursor: imageZoom > 1 ? 'grab' : 'default',
                    maxWidth: 'min(100vw - 2rem, 100%)',
                    maxHeight: 'min(100vh - 2rem, 100%)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  draggable={false}
                />
              </div>
            </div>

            {/* Zoom Info */}
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-black/60 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg backdrop-blur-sm text-xs sm:text-sm font-medium">
              {Math.round(imageZoom * 100)}%
            </div>

            {/* Instructions */}
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black/60 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg backdrop-blur-sm text-xs text-center max-w-[120px] sm:max-w-none">
              <div className="hidden sm:block">Use + / - keys or buttons</div>
              <div className="hidden sm:block">Press 0 to reset • ESC to close</div>
              <div className="sm:hidden">Tap buttons to zoom</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
