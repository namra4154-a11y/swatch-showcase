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
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowUp
} from "lucide-react";

const PAGE_SIZE = 24;

export default function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [supplier, setSupplier] = useState(params.get("supplier") || "all");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc">((params.get("sort") as "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc") || "newest");
  const [page, setPage] = useState<number>(parseInt(params.get("page") || "1", 10));
  
  // Advanced filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [fabricType, setFabricType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ? parseInt(params.get("minPrice")!) : 0);
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ? parseInt(params.get("maxPrice")!) : 500000);

  const dq = useDebounce(q, 300);

  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Available fabric types
  const fabricTypes = [
    "cotton", "silk", "linen", "wool", "polyester", "velvet", 
    "jute", "denim", "satin", "canvas", "chiffon", "tweed", 
    "fleece", "mesh", "corduroy"
  ];

  useEffect(() => {
    document.title = `Catalog – Sheth's `;
  }, []);

  useEffect(() => {
    getSuppliers()
      .then(setSuppliers)
      .catch((error) => {
        console.error("Failed to load suppliers:", error);
        setSuppliers([]);
      });
  }, []);

  // Extract available tags from products
  useEffect(() => {
    if (items.length > 0) {
      const tags = new Set<string>();
      items.forEach(item => {
        if (item.tags) {
          item.tags.forEach(tag => tags.add(tag));
        }
      });
      setAvailableTags(Array.from(tags).sort());
    }
  }, [items]);

  // Load initial products on mount
  useEffect(() => {
    async function loadInitialProducts() {
      setLoading(true);
      try {
        const { items, total } = await searchProducts({ 
          q: "", 
          supplier: undefined, 
          sort: "newest", 
          page: 1, 
          pageSize: PAGE_SIZE 
        });
        setItems(items);
        setTotal(total);
      } catch (e) {
        console.error("Failed to load initial products:", e);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }
    loadInitialProducts();
  }, []);

  useEffect(() => {
    // Skip initial navigation on mount
    const p = new URLSearchParams();
    if (dq) p.set("q", dq);
    if (supplier && supplier !== "all") p.set("supplier", supplier);
    if (sort !== "newest") p.set("sort", sort);
    if (page > 1) p.set("page", String(page));
    if (minPrice > 0) p.set("minPrice", String(minPrice));
    if (maxPrice < 5000) p.set("maxPrice", String(maxPrice));
    if (selectedTags.length > 0) p.set("tags", selectedTags.join(","));
    if (selectedCategory !== "all") p.set("category", selectedCategory);
    if (fabricType !== "all") p.set("fabricType", fabricType);
    
    const newSearch = p.toString();
    if (newSearch !== location.search) {
      navigate({ pathname: "/products", search: newSearch }, { replace: true });
    }
  }, [dq, supplier, sort, page, minPrice, maxPrice, selectedTags, fabricType, navigate, location.search]);

  useEffect(() => {
    async function run() {
      setLoading(true);
      try {
        const { items, total } = await searchProducts({ 
          q: dq, 
          supplier: supplier === "all" ? undefined : supplier, 
          sort, 
          page, 
          pageSize: PAGE_SIZE 
        });
        
        // Apply client-side filters
        let filteredItems = items;
        
        // Filter by price range
        filteredItems = filteredItems.filter(item => 
          item.product_rate_inr >= minPrice && item.product_rate_inr <= maxPrice
        );
        
        // Filter by tags
        if (selectedTags.length > 0) {
          filteredItems = filteredItems.filter(item => 
            item.tags && selectedTags.some(tag => item.tags!.includes(tag))
          );
        }
        
        // Filter by fabric type
        if (fabricType !== "all") {
          filteredItems = filteredItems.filter(item => 
            item.fabric_name && item.fabric_name.toLowerCase().includes(fabricType.toLowerCase())
          );
        }
        
        // Filter by category
        if (selectedCategory !== "all") {
          filteredItems = filteredItems.filter(item => 
            item.category === selectedCategory
          );
        }
        
        setItems(filteredItems);
        setTotal(filteredItems.length);
      } catch (e) {
        console.error("Failed to load products:", e);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [dq, supplier, sort, page, minPrice, maxPrice, selectedTags, selectedCategory, fabricType]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const clearAllFilters = () => {
    setQ("");
    setSupplier("all");
    setSort("newest");
    setPage(1);
    setMinPrice(0);
    setMaxPrice(5000);
    setSelectedTags([]);
    setSelectedCategory("all");
    setFabricType("all");
  };

  const activeFiltersCount = [
    q ? 1 : 0,
    supplier !== "all" ? 1 : 0,
    sort !== "newest" ? 1 : 0,
    minPrice > 0 ? 1 : 0,
    maxPrice < 5000 ? 1 : 0,
    selectedTags.length,
    selectedCategory !== "all" ? 1 : 0,
    fabricType !== "all" ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <main className="container py-6 space-y-6">
      {/* Header Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by name, design number, fabric, or tags..."
            className="pl-10 pr-4 py-3 text-lg"
          />
          {q && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setQ("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>


      </section>

      {/* Filters Section */}
      {showFilters && (
        <Card className="animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Supplier Filter */}
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplier} onValueChange={(v) => { setSupplier(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All suppliers</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Filter */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sort} onValueChange={(v: "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc") => { setSort(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="name_asc">Name: A-Z</SelectItem>
                    <SelectItem value="name_desc">Name: Z-A</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="Kurta suit">Kurta suit</SelectItem>
                    <SelectItem value="Jakit suit">Jakit suit</SelectItem>
                    <SelectItem value="Coat suit">Coat suit</SelectItem>
                    <SelectItem value="Jodhpuri suit">Jodhpuri suit</SelectItem>
                    <SelectItem value="Three peice indo suit">Three peice indo suit</SelectItem>
                    <SelectItem value="Pathani suit">Pathani suit</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fabric Type Filter */}
              <div className="space-y-2">
                <Label>Fabric Type</Label>
                <Select value={fabricType} onValueChange={(v) => { setFabricType(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All fabric types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All fabric types</SelectItem>
                    {fabricTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2">
                <Label>Price Range (₹)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value) || 5000)}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            <div className="space-y-3">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTags([...selectedTags, tag]);
                        } else {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        }
                        setPage(1);
                      }}
                    />
                    <Label htmlFor={tag} className="text-sm cursor-pointer">
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {q && (
            <Badge variant="secondary" className="gap-1">
              Search: "{q}"
              <X className="h-3 w-3 cursor-pointer" onClick={() => setQ("")} />
            </Badge>
          )}
          {supplier !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Supplier: {supplier}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSupplier("all")} />
            </Badge>
          )}
          {sort !== "newest" && (
            <Badge variant="secondary" className="gap-1">
              Sort: {sort.replace("_", " ")}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSort("newest")} />
            </Badge>
          )}
          {(minPrice > 0 || maxPrice < 5000) && (
            <Badge variant="secondary" className="gap-1">
              Price: ₹{minPrice} - ₹{maxPrice}
              <X className="h-3 w-3 cursor-pointer" onClick={() => { setMinPrice(0); setMaxPrice(5000); }} />
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))} />
            </Badge>
          ))}
          {selectedCategory !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Category: {selectedCategory}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
            </Badge>
          )}
          {fabricType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {fabricType}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFabricType("all")} />
            </Badge>
          )}
        </div>
      )}

      <Separator />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {items.length} of {total} products
        </p>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all filters
          </Button>
        )}
      </div>

      {/* Products by Category */}
      <section aria-busy={loading}>
        {loading ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" 
            : "space-y-4"
          }>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`animate-pulse bg-muted rounded ${
                viewMode === "grid" ? "h-64" : "h-24"
              }`}>
                {viewMode === "list" && (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-muted-foreground/20 rounded-md"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-1/3"></div>
                        <div className="h-4 bg-muted-foreground/20 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            <div className="text-lg font-medium mb-2">No products found</div>
            <div className="text-sm mb-4">Try adjusting your search criteria or check back later.</div>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {(() => {
              // Group products by category
              const categories = [
                "Kurta suit",
                "Jakit suit", 
                "Coat suit",
                "Jodhpuri suit",
                "Three peice indo suit",
                "Pathani suit",
                "others"
              ];
              
              return categories.map(category => {
                const categoryProducts = items.filter(item => item.category === category);
                
                // Skip empty categories
                if (categoryProducts.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold tracking-tight">{category}</h2>
                      <Badge variant="secondary" className="text-sm">
                        {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'}
                      </Badge>
                    </div>
                    
                    <div className={viewMode === "grid" 
                      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" 
                      : "space-y-4"
                    }>
                      {categoryProducts.map((p) => (
                        <ProductCard 
                          key={p.id} 
                          product={p} 
                          onClick={() => navigate(`/products/${encodeURIComponent(p.design_no)}`)}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
                const pageNumber = Math.min(Math.max(1, page - 3), Math.max(1, totalPages - 6)) + i;
                if (pageNumber > totalPages) return null;
                return (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      isActive={pageNumber === page} 
                      onClick={() => setPage(pageNumber)}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Back to Top Button */}
      {page > 1 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPage(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-shadow"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
      )}
    </main>
  );
}
