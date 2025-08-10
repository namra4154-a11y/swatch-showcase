import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Database, Plus, Download, Sparkles, Filter, Grid3X3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  useEffect(() => { document.title = "Sheth's  – Product Catalog"; }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    navigate(`/products?${params.toString()}`);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-background via-background to-muted/20">
      <section className="container py-20 grid gap-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <Sparkles className="h-4 w-4" />
            Modern Product Catalog
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Fast, searchable product catalog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Search, filter, add, and export ~500 SKUs with a clean, modern interface designed for efficiency.
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={onSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Search by name, design no, fabric..." 
                className="h-14 pl-12 pr-4 text-lg bg-background/80 border-2 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 text-lg font-medium">
              Search
            </Button>
          </form>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/20 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Browse Catalog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Explore our comprehensive product catalog with advanced filtering, sorting, and search capabilities.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/products")}
                className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
              >
                Open Catalog
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/20 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Manual Add</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Add new products to the catalog with images and detailed specifications in just a few clicks.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/add")}
                className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
              >
                Add Product
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/20 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Export CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Download the complete products database as CSV for external analysis and reporting needs.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/export")}
                className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
              >
                Export
              </Button>
            </CardContent>
          </Card>
        </div>


      </section>
    </main>
  );
};

export default Index;
