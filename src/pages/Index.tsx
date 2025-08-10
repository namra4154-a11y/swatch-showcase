import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  useEffect(() => { document.title = "Swatch Showcase – Product Catalog"; }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    navigate(`/products?${params.toString()}`);
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-background">
      <section className="container py-16 grid gap-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight">Fast, searchable product catalog</h1>
          <p className="mt-3 text-lg text-muted-foreground">Search, filter, add, and export ~500 SKUs with a clean UI.</p>
        </div>
        <form onSubmit={onSearch} className="mx-auto flex w-full max-w-xl gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, design no, fabric..." />
          <Button type="submit">Search</Button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-6 grid gap-2">
              <h3 className="font-medium">Browse Catalog</h3>
              <p className="text-sm text-muted-foreground">View products, search, and filter.</p>
              <Button variant="secondary" onClick={() => navigate("/products")}>Open Catalog</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 grid gap-2">
              <h3 className="font-medium">Manual Add</h3>
              <p className="text-sm text-muted-foreground">Insert a single product with image.</p>
              <Button variant="secondary" onClick={() => navigate("/add")}>Add Product</Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 grid gap-2">
              <h3 className="font-medium">Export CSV</h3>
              <p className="text-sm text-muted-foreground">Download the products table as CSV.</p>
              <Button variant="secondary" onClick={() => navigate("/export")}>Export</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default Index;
