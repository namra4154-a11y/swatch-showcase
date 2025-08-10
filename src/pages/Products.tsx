import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchProducts, getSuppliers, Product } from "@/lib/products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ProductCard } from "@/components/ProductCard";
import { useDebounce } from "@/hooks/use-debounce";

const PAGE_SIZE = 24;

export default function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [supplier, setSupplier] = useState(params.get("supplier") ?? "");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">((params.get("sort") as any) || "newest");
  const [page, setPage] = useState<number>(parseInt(params.get("page") || "1", 10));

  const dq = useDebounce(q, 300);

  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = `Catalog – Swatch Showcase`;
  }, []);

  useEffect(() => {
    getSuppliers().then(setSuppliers).catch(console.error);
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (dq) p.set("q", dq);
    if (supplier) p.set("supplier", supplier);
    if (sort !== "newest") p.set("sort", sort);
    if (page > 1) p.set("page", String(page));
    navigate({ pathname: "/products", search: p.toString() }, { replace: true });
  }, [dq, supplier, sort, page, navigate]);

  useEffect(() => {
    async function run() {
      setLoading(true);
      try {
        const { items, total } = await searchProducts({ q: dq, supplier: supplier || undefined, sort, page, pageSize: PAGE_SIZE });
        setItems(items);
        setTotal(total);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [dq, supplier, sort, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="container py-6">
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Product Catalog</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex gap-2">
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, design no, fabric..."/>
            <Button onClick={() => setPage(1)}>Search</Button>
          </div>
          <Select value={supplier} onValueChange={(v) => { setSupplier(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All suppliers</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v: any) => setSort(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <Separator className="my-6" />

      <section aria-busy={loading}>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse h-64 bg-muted rounded"/>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/products/${encodeURIComponent(p.design_no)}`)} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-8">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNumber = Math.min(Math.max(1, page - 2), Math.max(1, totalPages - 4)) + i;
              if (pageNumber > totalPages) return null;
              return (
                <PaginationItem key={i}>
                  <PaginationLink isActive={pageNumber === page} onClick={() => setPage(pageNumber)}>
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </main>
  );
}
