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
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";
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
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "name_desc":
      query = query.order("name", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Supabase query error:", error);
    throw error;
  }

  return { items: (data as Product[]) ?? [], total: count ?? 0 };
}

export async function getSuppliers(): Promise<string[]> {
  const { data, error } = await supabase
    .from("products")
    .select("fabric_supplier")
    .neq("fabric_supplier", null);

  if (error) {
    console.error("Error fetching suppliers:", error);
    throw error;
  }

  const set = new Set<string>();
  (data || []).forEach((row) => {
    if (row.fabric_supplier) set.add(row.fabric_supplier);
  });
  const suppliers = Array.from(set).sort();
  return suppliers;
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

export async function addProductRow(
  product: Omit<Product, "id" | "created_at" | "updated_at">
) {
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
    storagePath: pathInBucket, // Just the relative path, not full "product-images/..."
    publicUrl: bucket.getPublicUrl(pathInBucket).data.publicUrl,
  };
}

export async function exportProductsCSV(): Promise<string> {
  const { data, error } = await supabase.from("products").select("*").csv();
  if (error) throw error;
  return data as unknown as string; // supabase-js returns string
}

export async function exportProductsXLSX(): Promise<Blob> {
  // This function requires xlsx and file-saver dependencies to be installed
  // npm install xlsx file-saver

  try {
    // Dynamic import to avoid build errors if dependencies aren't installed
    const XLSX = await import("xlsx");

    // Fetch all products
    const { data: products, error } = await supabase
      .from("products")
      .select("*");
    if (error) throw error;

    // Prepare data for Excel
    const excelData = products.map((product) => ({
      ID: product.id,
      Name: product.name,
      "Design No.": product.design_no,
      "Fabric Supplier": product.fabric_supplier || "",
      "Fabric Name": product.fabric_name || "",
      "Fabric Rate (₹)": product.fabric_rate_inr || 0,
      "Panno (inch)": product.panno_inch || 0,
      Matching: product.matching || "",
      "Matching Fabric Rate (₹)": product.matching_fabric_rate_inr || 0,
      "Matching Fabric Panno (inch)": product.matching_fabric_panno_inch || 0,
      "Product Rate (₹)": product.product_rate_inr,
      Tags: product.tags ? product.tags.join(", ") : "",
      "Created At": new Date(product.created_at).toLocaleDateString(),
      "Updated At": new Date(product.updated_at).toLocaleDateString(),
      "Image Path": product.image_path,
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 36 }, // ID
      { wch: 30 }, // Name
      { wch: 15 }, // Design No.
      { wch: 20 }, // Fabric Supplier
      { wch: 25 }, // Fabric Name
      { wch: 15 }, // Fabric Rate
      { wch: 15 }, // Panno
      { wch: 20 }, // Matching
      { wch: 20 }, // Matching Rate
      { wch: 20 }, // Matching Panno
      { wch: 15 }, // Product Rate
      { wch: 30 }, // Tags
      { wch: 15 }, // Created At
      { wch: 15 }, // Updated At
      { wch: 40 }, // Image Path
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    console.error("Error exporting to XLSX:", error);
    throw new Error(
      "Failed to export to XLSX. Please ensure xlsx dependency is installed."
    );
  }
}

export async function exportProductsXLSXWithImages(): Promise<Blob> {
  // This function requires xlsx and file-saver dependencies to be installed
  // npm install xlsx file-saver

  try {
    // Dynamic import to avoid build errors if dependencies aren't installed
    const XLSX = await import("xlsx");

    // Fetch all products
    const { data: products, error } = await supabase
      .from("products")
      .select("*");
    if (error) throw error;

    // Prepare data for Excel
    const excelData = products.map((product) => ({
      ID: product.id,
      Name: product.name,
      "Design No.": product.design_no,
      "Fabric Supplier": product.fabric_supplier || "",
      "Fabric Name": product.fabric_name || "",
      "Fabric Rate (₹)": product.fabric_rate_inr || 0,
      "Panno (inch)": product.panno_inch || 0,
      Matching: product.matching || "",
      "Matching Fabric Rate (₹)": product.matching_fabric_rate_inr || 0,
      "Matching Fabric Panno (inch)": product.matching_fabric_panno_inch || 0,
      "Product Rate (₹)": product.product_rate_inr,
      Tags: product.tags ? product.tags.join(", ") : "",
      "Created At": new Date(product.created_at).toLocaleDateString(),
      "Updated At": new Date(product.updated_at).toLocaleDateString(),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 36 }, // ID
      { wch: 30 }, // Name
      { wch: 15 }, // Design No.
      { wch: 20 }, // Fabric Supplier
      { wch: 25 }, // Fabric Name
      { wch: 15 }, // Fabric Rate
      { wch: 15 }, // Panno
      { wch: 20 }, // Matching
      { wch: 20 }, // Matching Rate
      { wch: 20 }, // Matching Panno
      { wch: 15 }, // Product Rate
      { wch: 30 }, // Tags
      { wch: 15 }, // Created At
      { wch: 15 }, // Updated At
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    console.error("Error exporting to XLSX:", error);
    throw new Error(
      "Failed to export to XLSX. Please ensure xlsx dependency is installed."
    );
  }
}

export async function exportProductsXLSXWithEmbeddedImages(): Promise<Blob> {
  try {
    console.log("Starting XLSX export with embedded images...");

    // Dynamic import to avoid build errors if dependencies aren't installed
    const XLSX = await import("xlsx");
    console.log("XLSX library loaded successfully");

    // Fetch all products
    const { data: products, error } = await supabase
      .from("products")
      .select("*");
    if (error) throw error;

    console.log(`Fetched ${products.length} products for export`);

    // Prepare data for Excel (without image column initially)
    const excelData = products.map((product) => ({
      ID: product.id,
      Name: product.name,
      "Design No.": product.design_no,
      "Fabric Supplier": product.fabric_supplier || "",
      "Fabric Name": product.fabric_name || "",
      "Fabric Rate (₹)": product.fabric_rate_inr || 0,
      "Panno (inch)": product.panno_inch || 0,
      Matching: product.matching || "",
      "Matching Fabric Rate (₹)": product.matching_fabric_rate_inr || 0,
      "Matching Fabric Panno (inch)": product.matching_fabric_panno_inch || 0,
      "Product Rate (₹)": product.product_rate_inr,
      Tags: product.tags ? product.tags.join(", ") : "",
      "Created At": new Date(product.created_at).toLocaleDateString(),
      "Updated At": new Date(product.updated_at).toLocaleDateString(),
    }));

    console.log("Prepared Excel data structure");

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 36 }, // ID
      { wch: 30 }, // Name
      { wch: 15 }, // Design No.
      { wch: 20 }, // Fabric Supplier
      { wch: 25 }, // Fabric Name
      { wch: 15 }, // Fabric Rate
      { wch: 15 }, // Panno
      { wch: 20 }, // Matching
      { wch: 20 }, // Matching Rate
      { wch: 20 }, // Matching Panno
      { wch: 15 }, // Product Rate
      { wch: 30 }, // Tags
      { wch: 15 }, // Created At
      { wch: 15 }, // Updated At
    ];
    worksheet["!cols"] = columnWidths;

    // Set row heights for image rows
    const rowHeights = [];
    for (let i = 0; i <= products.length; i++) {
      rowHeights.push({ hpt: i === 0 ? 25 : 120 }); // Header row: 25pt, data rows: 120pt for images
    }
    worksheet["!rows"] = rowHeights;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Process images and add them to the worksheet
    try {
      console.log("Starting image processing...");

      // Add image column header
      const imageColumn = "O"; // Column O
      worksheet[`${imageColumn}1`] = { v: "Product Image", t: "s" };

      let processedImages = 0;
      let failedImages = 0;

      // Process each product image
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const rowIndex = i + 2; // +2 because Excel is 1-indexed and we have a header

        if (product.image_path) {
          try {
            // Get the image URL
            let imageUrl: string;
            if (product.image_path.startsWith("http")) {
              imageUrl = product.image_path;
            } else {
              const cleanPath = product.image_path.replace(
                /^product-images\//,
                ""
              );
              imageUrl = supabase.storage
                .from("product-images")
                .getPublicUrl(cleanPath).data.publicUrl;
            }

            console.log(
              `Processing image for ${product.design_no}: ${imageUrl}`
            );

            // Download the image
            const response = await fetch(imageUrl);
            if (response.ok) {
              const imageBlob = await response.blob();
              const imageBuffer = await imageBlob.arrayBuffer();

              // Determine image type from blob
              const imageType = imageBlob.type || "image/jpeg";
              const imageExtension = imageType.split("/")[1] || "jpeg";

              // Convert to base64
              const base64String = btoa(
                new Uint8Array(imageBuffer).reduce(
                  (data, byte) => data + String.fromCharCode(byte),
                  ""
                )
              );

              // Add image to worksheet using XLSX's image support
              if (!worksheet["!images"]) {
                worksheet["!images"] = [];
              }

              // Calculate image position (in pixels)
              const imageData = {
                name: `image_${product.design_no}_${i}`,
                data: base64String,
                opts: {
                  base64: true,
                  type: imageType,
                },
                position: {
                  type: "twoCellAnchor",
                  from: {
                    col: 14, // Column O (0-indexed)
                    colOff: 5,
                    row: i + 1, // Row index (0-indexed)
                    rowOff: 5,
                  },
                  to: {
                    col: 15, // Column P
                    colOff: -5,
                    row: i + 2, // Next row
                    rowOff: -5,
                  },
                },
              };

              worksheet["!images"].push(imageData);
              processedImages++;

              // Add a note about the image
              worksheet[`${imageColumn}${rowIndex}`] = {
                v: `Image: ${product.design_no}`,
                t: "s",
              };

              console.log(
                `Successfully embedded image for ${product.design_no}`
              );
            } else {
              console.warn(
                `Failed to fetch image for ${product.design_no}: ${response.status} ${response.statusText}`
              );
              worksheet[`${imageColumn}${rowIndex}`] = {
                v: "Image not available",
                t: "s",
              };
              failedImages++;
            }
          } catch (imageError) {
            console.warn(
              `Failed to process image for product ${product.design_no}:`,
              imageError
            );
            worksheet[`${imageColumn}${rowIndex}`] = {
              v: "Image processing failed",
              t: "s",
            };
            failedImages++;
          }
        } else {
          worksheet[`${imageColumn}${rowIndex}`] = { v: "No image", t: "s" };
        }
      }

      console.log(
        `Image processing complete: ${processedImages} successful, ${failedImages} failed`
      );

      // Update column width for image column
      columnWidths.push({ wch: 25 }); // Image column width
      worksheet["!cols"] = columnWidths;
    } catch (imageError) {
      console.warn("Failed to add images to Excel:", imageError);
      // Continue without images
    }

    console.log("Generating Excel file...");

    // Generate Excel file with image support
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      bookImages: true, // Enable image support
    });

    console.log("Excel file generated successfully");

    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    console.error("Error exporting to XLSX with images:", error);
    throw new Error(
      `Failed to export to XLSX with images: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function exportProductsXLSXWithImagesAlternative(): Promise<Blob> {
  try {
    // Dynamic import to avoid build errors if dependencies aren't installed
    const XLSX = await import("xlsx");

    // Fetch all products
    const { data: products, error } = await supabase
      .from("products")
      .select("*");
    if (error) throw error;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create a worksheet with product data
    const productData = products.map((product) => ({
      ID: product.id,
      Name: product.name,
      "Design No.": product.design_no,
      "Fabric Supplier": product.fabric_supplier || "",
      "Fabric Name": product.fabric_name || "",
      "Fabric Rate (₹)": product.fabric_rate_inr || 0,
      "Panno (inch)": product.panno_inch || 0,
      Matching: product.matching || "",
      "Matching Fabric Rate (₹)": product.matching_fabric_rate_inr || 0,
      "Matching Fabric Panno (inch)": product.matching_fabric_panno_inch || 0,
      "Product Rate (₹)": product.product_rate_inr,
      Tags: product.tags ? product.tags.join(", ") : "",
      "Created At": new Date(product.created_at).toLocaleDateString(),
      "Updated At": new Date(product.updated_at).toLocaleDateString(),
      "Image URL": product.image_path
        ? (() => {
            if (product.image_path.startsWith("http")) {
              return product.image_path;
            } else {
              const cleanPath = product.image_path.replace(
                /^product-images\//,
                ""
              );
              return supabase.storage
                .from("product-images")
                .getPublicUrl(cleanPath).data.publicUrl;
            }
          })()
        : "No image",
    }));

    const worksheet = XLSX.utils.json_to_sheet(productData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 36 }, // ID
      { wch: 30 }, // Name
      { wch: 15 }, // Design No.
      { wch: 20 }, // Fabric Supplier
      { wch: 25 }, // Fabric Name
      { wch: 15 }, // Fabric Rate
      { wch: 15 }, // Panno
      { wch: 20 }, // Matching
      { wch: 20 }, // Matching Rate
      { wch: 20 }, // Matching Panno
      { wch: 15 }, // Product Rate
      { wch: 30 }, // Tags
      { wch: 15 }, // Created At
      { wch: 15 }, // Updated At
      { wch: 60 }, // Image URL
    ];

    // Set row heights for better image viewing
    const rowHeights = [];
    for (let i = 0; i <= products.length; i++) {
      rowHeights.push({ hpt: i === 0 ? 25 : 100 }); // Header: 25pt, data: 100pt
    }
    worksheet["!rows"] = rowHeights;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Create a separate worksheet for images
    const imageWorksheet = XLSX.utils.aoa_to_sheet([
      ["Product Images Gallery"],
      ["Design No.", "Product Name", "Image"],
      ...products.map((product) => [
        product.design_no,
        product.name,
        product.image_path
          ? (() => {
              if (product.image_path.startsWith("http")) {
                return product.image_path;
              } else {
                const cleanPath = product.image_path.replace(
                  /^product-images\//,
                  ""
                );
                return supabase.storage
                  .from("product-images")
                  .getPublicUrl(cleanPath).data.publicUrl;
              }
            })()
          : "No image",
      ]),
    ]);

    // Set column widths for image worksheet
    imageWorksheet["!cols"] = [
      { wch: 20 }, // Design No.
      { wch: 40 }, // Product Name
      { wch: 80 }, // Image URL
    ];

    // Set row heights for image worksheet
    const imageRowHeights = [];
    for (let i = 0; i <= products.length + 1; i++) {
      imageRowHeights.push({ hpt: i === 0 ? 30 : i === 1 ? 25 : 120 }); // Title: 30pt, Header: 25pt, Data: 120pt
    }
    imageWorksheet["!rows"] = imageRowHeights;

    // Add image worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, imageWorksheet, "Image Gallery");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    console.error("Error exporting to XLSX with images (alternative):", error);
    throw new Error(
      "Failed to export to XLSX with images. Please ensure xlsx dependency is installed."
    );
  }
}

export async function exportProductsXLSXWithImageURLs(): Promise<Blob> {
  try {
    // Dynamic import to avoid build errors if dependencies aren't installed
    const XLSX = await import("xlsx");

    // Fetch all products
    const { data: products, error } = await supabase
      .from("products")
      .select("*");
    if (error) throw error;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create main products worksheet
    const productData = products.map((product) => ({
      ID: product.id,
      Name: product.name,
      "Design No.": product.design_no,
      "Fabric Supplier": product.fabric_supplier || "",
      "Fabric Name": product.fabric_name || "",
      "Fabric Rate (₹)": product.fabric_rate_inr || 0,
      "Panno (inch)": product.panno_inch || 0,
      Matching: product.matching || "",
      "Matching Fabric Rate (₹)": product.matching_fabric_rate_inr || 0,
      "Matching Fabric Panno (inch)": product.matching_fabric_panno_inch || 0,
      "Product Rate (₹)": product.product_rate_inr,
      Tags: product.tags ? product.tags.join(", ") : "",
      "Created At": new Date(product.created_at).toLocaleDateString(),
      "Updated At": new Date(product.updated_at).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(productData);

    // Set column widths for main worksheet
    worksheet["!cols"] = [
      { wch: 36 }, // ID
      { wch: 30 }, // Name
      { wch: 15 }, // Design No.
      { wch: 20 }, // Fabric Supplier
      { wch: 25 }, // Fabric Name
      { wch: 15 }, // Fabric Rate
      { wch: 15 }, // Panno
      { wch: 20 }, // Matching
      { wch: 20 }, // Matching Rate
      { wch: 20 }, // Matching Panno
      { wch: 15 }, // Product Rate
      { wch: 30 }, // Tags
      { wch: 15 }, // Created At
      { wch: 15 }, // Updated At
    ];

    // Add main worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Create Image Gallery worksheet with instructions
    const imageGalleryData = [
      ["Product Image Gallery - Instructions"],
      [""],
      ["How to insert images:"],
      ["1. Select the cell where you want the image"],
      ["2. Go to Insert → Picture → Picture from Web"],
      ["3. Copy and paste the URL from the 'Image URL' column"],
      ["4. Click 'Insert'"],
      ["5. Resize the image as needed"],
      [""],
      ["Alternative method:"],
      ["1. Right-click on the cell"],
      ["2. Select 'Insert Picture' → 'Picture from Web'"],
      ["3. Paste the URL and click Insert"],
      [""],
      ["Design No.", "Product Name", "Image URL", "Image Preview"],
      ...products.map((product) => [
        product.design_no,
        product.name,
        product.image_path
          ? (() => {
              if (product.image_path.startsWith("http")) {
                return product.image_path;
              } else {
                const cleanPath = product.image_path.replace(
                  /^product-images\//,
                  ""
                );
                return supabase.storage
                  .from("product-images")
                  .getPublicUrl(cleanPath).data.publicUrl;
              }
            })()
          : "No image available",
        product.image_path ? "Click URL to view image" : "No image",
      ]),
    ];

    const imageWorksheet = XLSX.utils.aoa_to_sheet(imageGalleryData);

    // Set column widths for image worksheet
    imageWorksheet["!cols"] = [
      { wch: 20 }, // Design No.
      { wch: 40 }, // Product Name
      { wch: 80 }, // Image URL
      { wch: 30 }, // Image Preview
    ];

    // Set row heights for better formatting
    const imageRowHeights = [];
    for (let i = 0; i < imageGalleryData.length; i++) {
      if (i === 0) {
        imageRowHeights.push({ hpt: 30 }); // Title row
      } else if (i < 15) {
        imageRowHeights.push({ hpt: 20 }); // Instruction rows
      } else {
        imageRowHeights.push({ hpt: 25 }); // Data rows
      }
    }
    imageWorksheet["!rows"] = imageRowHeights;

    // Add image worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, imageWorksheet, "Image Gallery");

    // Create a simplified image insertion worksheet
    const insertionData = [
      ["Quick Image Insertion Guide"],
      [""],
      ["Step-by-step process:"],
      ["1. Open the 'Image Gallery' worksheet"],
      ["2. Copy the URL from the 'Image URL' column"],
      ["3. Go to Insert → Picture → Picture from Web"],
      ["4. Paste the URL and click Insert"],
      ["5. Position and resize the image as needed"],
      [""],
      ["Tips:"],
      ["• Images will be displayed at their original resolution"],
      ["• You can resize images by dragging the corners"],
      ["• Images are linked to the URLs, so they update if changed"],
      ["• Save the file to preserve image positions"],
      [""],
      ["Product Count:", products.length.toString()],
      [
        "Images Available:",
        products.filter((p) => p.image_path).length.toString(),
      ],
      ["Last Updated:", new Date().toLocaleString()],
    ];

    const insertionWorksheet = XLSX.utils.aoa_to_sheet(insertionData);

    // Set column widths for insertion worksheet
    insertionWorksheet["!cols"] = [
      { wch: 60 }, // Instructions column
    ];

    // Set row heights
    const insertionRowHeights = [];
    for (let i = 0; i < insertionData.length; i++) {
      if (i === 0) {
        insertionRowHeights.push({ hpt: 25 }); // Title
      } else if (i < 4) {
        insertionRowHeights.push({ hpt: 20 }); // Steps
      } else {
        insertionRowHeights.push({ hpt: 18 }); // Other content
      }
    }
    insertionWorksheet["!rows"] = insertionRowHeights;

    // Add insertion worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, insertionWorksheet, "Instructions");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    console.error("Error exporting to XLSX with image URLs:", error);
    throw new Error(
      "Failed to export to XLSX with image URLs. Please ensure xlsx dependency is installed."
    );
  }
}

export async function exportProductsXLSXWithImageFormula(): Promise<Blob> {
  try {
    // Dynamic import to avoid build errors if dependencies aren't installed
    const XLSX = await import("xlsx");

    // Fetch all products
    const { data: products, error } = await supabase
      .from("products")
      .select("*");
    if (error) throw error;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create single worksheet with all product details and image URLs
    const productData = products.map((product) => {
      let imageUrl = "";
      if (product.image_path) {
        if (product.image_path.startsWith("http")) {
          imageUrl = product.image_path;
        } else {
          const cleanPath = product.image_path.replace(/^product-images\//, "");
          imageUrl = supabase.storage
            .from("product-images")
            .getPublicUrl(cleanPath).data.publicUrl;
        }
      }

      return {
        ID: product.id,
        Name: product.name,
        "Design No.": product.design_no,
        "Fabric Supplier": product.fabric_supplier || "",
        "Fabric Name": product.fabric_name || "",
        "Fabric Rate (₹)": product.fabric_rate_inr || 0,
        "Panno (inch)": product.panno_inch || 0,
        Matching: product.matching || "",
        "Matching Fabric Rate (₹)": product.matching_fabric_rate_inr || 0,
        "Matching Fabric Panno (inch)": product.matching_fabric_panno_inch || 0,
        "Product Rate (₹)": product.product_rate_inr,
        Tags: product.tags ? product.tags.join(", ") : "",
        "Created At": new Date(product.created_at).toLocaleDateString(),
        "Updated At": new Date(product.updated_at).toLocaleDateString(),
        "Image URL": imageUrl || "No image available",
        "Image Formula": imageUrl
          ? `=IMAGE("${imageUrl}")`
          : "No image available",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(productData);

    // Set column widths for the worksheet
    worksheet["!cols"] = [
      { wch: 36 }, // ID
      { wch: 30 }, // Name
      { wch: 15 }, // Design No.
      { wch: 20 }, // Fabric Supplier
      { wch: 25 }, // Fabric Name
      { wch: 15 }, // Fabric Rate
      { wch: 15 }, // Panno
      { wch: 20 }, // Matching
      { wch: 20 }, // Matching Rate
      { wch: 20 }, // Matching Panno
      { wch: 15 }, // Product Rate
      { wch: 30 }, // Tags
      { wch: 15 }, // Created At
      { wch: 15 }, // Updated At
      { wch: 60 }, // Image URL
      { wch: 80 }, // Image Formula
    ];

    // Set row heights for better formatting
    const rowHeights = [];
    for (let i = 0; i <= products.length; i++) {
      rowHeights.push({ hpt: i === 0 ? 25 : 100 }); // Header: 25pt, data: 100pt
    }
    worksheet["!rows"] = rowHeights;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    console.error("Error exporting to XLSX with IMAGE formula:", error);
    throw new Error(
      "Failed to export to XLSX with IMAGE formula. Please ensure xlsx dependency is installed."
    );
  }
}

export async function updateProduct(
  designNo: string,
  updates: Partial<Omit<Product, "id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("products")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("design_no", designNo)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    throw error;
  }

  return data as Product;
}

export async function deleteProduct(designNo: string) {
  // First get the product to get the image path
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("image_path")
    .eq("design_no", designNo)
    .single();

  if (fetchError) {
    console.error("Error fetching product for deletion:", fetchError);
    throw fetchError;
  }

  // Delete the product from the database
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("design_no", designNo);

  if (deleteError) {
    console.error("Error deleting product:", deleteError);
    throw deleteError;
  }

  // Try to delete the image from storage (optional - don't fail if this fails)
  if (product.image_path && !product.image_path.startsWith("http")) {
    try {
      const cleanPath = product.image_path.replace(/^product-images\//, "");
      await supabase.storage.from("product-images").remove([cleanPath]);
    } catch (storageError) {
      console.warn("Failed to delete image from storage:", storageError);
      // Don't throw - the product was deleted successfully
    }
  }

  return true;
}
