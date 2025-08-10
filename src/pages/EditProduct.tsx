import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { getProductByDesignNo, updateProduct, uploadProductImage, Product } from "@/lib/products";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Upload, Package, Tag, DollarSign, Ruler, Image as ImageIcon, CheckCircle, X, ArrowLeft } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  design_no: z.string().min(1),
  fabric_supplier: z.string().optional().or(z.literal("")),
  fabric_name: z.string().optional().or(z.literal("")),
  fabric_rate_inr: z.coerce.number().nonnegative().optional(),
  panno_inch: z.coerce.number().nonnegative().optional(),
  matching: z.string().optional().or(z.literal("")),
  matching_fabric_rate_inr: z.coerce.number().nonnegative().optional(),
  matching_fabric_panno_inch: z.coerce.number().nonnegative().optional(),
  product_rate_inr: z.coerce.number().nonnegative(),
  tags: z.string().optional(), // comma separated
  image: z.any().optional(),
});

export default function EditProductPage() {
  const { design_no } = useParams();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  useEffect(() => { 
    document.title = `Edit Product – Swatch Showcase`; 
  }, []);

  useEffect(() => {
    async function loadProduct() {
      if (!design_no) return;
      
      try {
        setLoading(true);
        const p = await getProductByDesignNo(design_no);
        if (!p) {
          toast({ title: "Product not found", description: "The product you're trying to edit doesn't exist." });
          navigate("/products");
          return;
        }
        
        setProduct(p);
        setCurrentImageUrl(p.image_path);
        
        // Pre-populate form
        form.reset({
          name: p.name,
          design_no: p.design_no,
          fabric_supplier: p.fabric_supplier || "",
          fabric_name: p.fabric_name || "",
          fabric_rate_inr: p.fabric_rate_inr || undefined,
          panno_inch: p.panno_inch || undefined,
          matching: p.matching || "",
          matching_fabric_rate_inr: p.matching_fabric_rate_inr || undefined,
          matching_fabric_panno_inch: p.matching_fabric_panno_inch || undefined,
          product_rate_inr: p.product_rate_inr,
          tags: p.tags ? p.tags.join(", ") : "",
        });
      } catch (e: any) {
        console.error(e);
        toast({ title: "Failed to load product", description: e.message });
        navigate("/products");
      } finally {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [design_no, form, navigate]);

  const handleImageChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    form.setValue("image", undefined);
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!product) return;
    
    try {
      setSubmitting(true);
      
      let imagePath = product.image_path;
      
      // Handle new image upload if provided
      if (selectedImage) {
        const { storagePath } = await uploadProductImage(values.design_no, selectedImage);
        imagePath = storagePath;
      }

      const payload = {
        name: values.name,
        design_no: values.design_no,
        fabric_supplier: values.fabric_supplier || null,
        fabric_name: values.fabric_name || null,
        fabric_rate_inr: values.fabric_rate_inr ?? null,
        panno_inch: values.panno_inch ?? null,
        matching: values.matching || null,
        matching_fabric_rate_inr: values.matching_fabric_rate_inr ?? null,
        matching_fabric_panno_inch: values.matching_fabric_panno_inch ?? null,
        product_rate_inr: values.product_rate_inr,
        image_path: imagePath,
        tags: values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      } as const;

      await updateProduct(product.design_no, payload);
      toast({ title: "Product updated", description: `Design ${values.design_no} has been updated successfully.` });
      navigate(`/products/${encodeURIComponent(values.design_no)}`);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to update product", description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
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
    );
  }

  if (!product) {
    return null;
  }

  return (
    <main className="container py-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-8 px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="text-center space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <Edit className="h-4 w-4" />
              Edit Product
            </div>
            <h1 className="text-2xl font-bold">Edit Design {product.design_no}</h1>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="design_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Design Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter design number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fabric_supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fabric Supplier</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter fabric supplier" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fabric_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fabric Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter fabric name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Measurements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing & Measurements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fabric_rate_inr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fabric Rate (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="panno_inch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Panno (inch)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="product_rate_inr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Rate (INR) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Matching Fabric */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Matching Fabric
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="matching"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Matching</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter matching fabric" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="matching_fabric_rate_inr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Matching Fabric Rate (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="matching_fabric_panno_inch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Matching Fabric Panno (inch)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Product Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Image Display */}
                {currentImageUrl && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Image:</label>
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={currentImageUrl.startsWith("http") ? currentImageUrl : `https://your-supabase-url.supabase.co/storage/v1/object/public/product-images/${currentImageUrl}`}
                        alt="Current product"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* New Image Upload */}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload New Image (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                handleImageChange(e.target.files);
                                field.onChange(e.target.files);
                              }}
                              className="flex-1"
                            />
                            {selectedImage && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeImage}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            )}
                          </div>
                          
                          {imagePreview && (
                            <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="tag1, tag2, tag3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
