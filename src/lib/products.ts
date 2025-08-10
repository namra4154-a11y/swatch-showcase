import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  design_no: string;
  fabric_supplier: string | null;
  fabric_name: string | null;
  fabric_rate_inr: number | null;
  panno_inch: number | null;
  matching: string | null;
  matching_fabric_rate_inr: number | null;
  matching_fabric_panno_inch: number | null;
  product_rate_inr: number;
  image_path: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

export type SearchParams = {
  q?: string;
  supplier?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
};

export async function searchProducts(params: SearchParams) {
  const { q = "", supplier, sort = "newest", page = 1, pageSize = 24 } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("products").select("*", { count: "exact" });

  if (q) {
    const like = `%${q}%`;
    query = query.or(
      `name.ilike.${like},design_no.ilike.${like},fabric_name.ilike.${like}`
    );
  }

  if (supplier) {
    query = query.eq("fabric_supplier", supplier);
  }

  switch (sort) {
    case "price_asc":
      query = query.order("product_rate_inr", { ascending: true });
      break;
    case "price_desc":
      query = query.order("product_rate_inr", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data as Product[]) ?? [], total: count ?? 0 };
}

export async function getSuppliers(): Promise<string[]> {
  const { data, error } = await supabase
    .from("products")
    .select("fabric_supplier")
    .neq("fabric_supplier", null);
  if (error) throw error;
  const set = new Set<string>();
  (data || []).forEach((row) => {
    if (row.fabric_supplier) set.add(row.fabric_supplier);
  });
  return Array.from(set).sort();
}

export async function getProductByDesignNo(designNo: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("design_no", designNo)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function getRelatedBySupplier(
  supplier: string,
  excludeDesignNo?: string,
  limit = 8
) {
  let q = supabase
    .from("products")
    .select("*")
    .eq("fabric_supplier", supplier)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (excludeDesignNo) q = q.neq("design_no", excludeDesignNo);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Product[]) ?? [];
}

export async function addProductRow(product: Omit<Product, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Product;
}

export async function uploadProductImage(designNo: string, file: File) {
  const bucket = supabase.storage.from("product-images");
  const pathInBucket = `${designNo}/main.webp`;
  // Upsert so re-uploads replace the file
  const { data, error } = await bucket.upload(pathInBucket, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/webp",
  });
  if (error) throw error;
  return {
    storagePath: `product-images/${pathInBucket}`,
    publicUrl: bucket.getPublicUrl(pathInBucket).data.publicUrl,
  };
}

export async function exportProductsCSV(): Promise<string> {
  const { data, error } = await supabase.from("products").select("*").csv();
  if (error) throw error;
  return data as unknown as string; // supabase-js returns string
}
