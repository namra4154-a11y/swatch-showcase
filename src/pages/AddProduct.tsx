import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { addProductRow, uploadProductImage } from "@/lib/products";
import { useState, useEffect } from "react";

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

  useEffect(() => { document.title = "Add Product – Swatch Showcase"; }, []);

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
    <main className="container py-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Manual Add Product</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Product name</FormLabel>
              <FormControl><Input placeholder="e.g. jakit suit" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="design_no" render={({ field }) => (
            <FormItem>
              <FormLabel>Design no.</FormLabel>
              <FormControl><Input placeholder="e.g. 820" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="product_rate_inr" render={({ field }) => (
            <FormItem>
              <FormLabel>Product rate (INR)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="e.g. 1295" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="fabric_supplier" render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric supplier</FormLabel>
              <FormControl><Input placeholder="e.g. M Mahindra Kumar" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="fabric_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric name</FormLabel>
              <FormControl><Input placeholder="e.g. computer emb" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="fabric_rate_inr" render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric rate (INR)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="e.g. 350" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="panno_inch" render={({ field }) => (
            <FormItem>
              <FormLabel>Panno (inch)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="e.g. 38" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="matching" render={({ field }) => (
            <FormItem>
              <FormLabel>Matching</FormLabel>
              <FormControl><Input placeholder="e.g. rayon" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="matching_fabric_rate_inr" render={({ field }) => (
            <FormItem>
              <FormLabel>Matching fabric rate (INR)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="e.g. 65" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="matching_fabric_panno_inch" render={({ field }) => (
            <FormItem>
              <FormLabel>Matching fabric Panno (inch)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="e.g. 44" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="tags" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Tags (comma separated)</FormLabel>
              <FormControl><Input placeholder="e.g. party, rayon" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="image" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Image</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Product"}</Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
