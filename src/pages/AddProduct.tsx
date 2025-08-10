import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { addProductRow, uploadProductImage } from "@/lib/products";
import { useState, useEffect } from "react";
import { Plus, Upload, Package, Tag, DollarSign, Ruler, Image as ImageIcon, CheckCircle, X } from "lucide-react";

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
  image: z
    .any()
    .refine((file: FileList) => file && file.length > 0, "Image is required"),
});

export default function AddProductPage() {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => { document.title = "Add Product – Swatch Showcase"; }, []);

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
    try {
      setSubmitting(true);
      const file = (values.image as FileList)[0];
      const designNo = values.design_no.trim();

      const { storagePath } = await uploadProductImage(designNo, file);

      const payload = {
        name: values.name,
        design_no: designNo,
        fabric_supplier: values.fabric_supplier || null,
        fabric_name: values.fabric_name || null,
        fabric_rate_inr: values.fabric_rate_inr ?? null,
        panno_inch: values.panno_inch ?? null,
        matching: values.matching || null,
        matching_fabric_rate_inr: values.matching_fabric_rate_inr ?? null,
        matching_fabric_panno_inch: values.matching_fabric_panno_inch ?? null,
        product_rate_inr: values.product_rate_inr,
        image_path: storagePath,
        tags: values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      } as const;

      await addProductRow(payload as any);
      toast({ title: "Product added", description: `Design ${designNo} created.` });
      form.reset();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to add product", description: e.message, });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container py-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <Plus className="h-4 w-4" />
            Add New Product
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Manual Add Product</h1>
          <p className="text-muted-foreground">Add a new product to the catalog with all necessary details and image.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Product name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. jakit suit" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="design_no" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Design no.</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 820" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="product_rate_inr" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Product rate (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g. 1295" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Tags (comma separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. party, rayon" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Fabric Information */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Fabric Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="fabric_supplier" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Fabric supplier</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. M Mahindra Kumar" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="fabric_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Fabric name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. computer emb" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="fabric_rate_inr" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Fabric rate (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g. 350" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="panno_inch" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Panno (inch)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g. 38" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Matching Information */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Matching Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="matching" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Matching</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. rayon" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="matching_fabric_rate_inr" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Matching fabric rate (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g. 65" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="matching_fabric_panno_inch" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Matching fabric Panno (inch)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g. 44" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Product Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField control={form.control} name="image" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Upload Image</FormLabel>
                    <FormControl>
                      {!selectedImage ? (
                        <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              field.onChange(e.target.files);
                              handleImageChange(e.target.files);
                            }}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <div className="text-lg font-medium mb-2">Click to upload image</div>
                            <div className="text-sm text-muted-foreground">PNG, JPG, GIF up to 10MB</div>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Image Preview */}
                          <div className="relative">
                            <img 
                              src={imagePreview!} 
                              alt="Product preview" 
                              className="w-full h-64 object-cover rounded-lg border border-border/50"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                              onClick={removeImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Upload Confirmation */}
                          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <div className="font-medium text-green-800">Image uploaded successfully!</div>
                              <div className="text-sm text-green-600">
                                {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                              </div>
                            </div>
                          </div>
                          
                          {/* Change Image Button */}
                          <div className="text-center">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                removeImage();
                                const input = document.getElementById('image-upload') as HTMLInputElement;
                                if (input) input.click();
                              }}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Change Image
                            </Button>
                          </div>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={submitting} 
                size="lg" 
                className="h-12 px-8 text-lg font-medium"
              >
                {submitting ? "Saving..." : "Save Product"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
