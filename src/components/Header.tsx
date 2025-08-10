import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Search, Menu } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQ(params.get("q") ?? "");
  }, [location.search]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    navigate(`/products?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Sheth's </span>
        </NavLink>
        
        <nav className="hidden lg:flex items-center gap-8 text-sm">
          <NavLink 
            to="/products" 
            className={({ isActive }) => 
              isActive 
                ? "text-primary font-medium relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary" 
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            Catalog
          </NavLink>
          <NavLink 
            to="/add" 
            className={({ isActive }) => 
              isActive 
                ? "text-primary font-medium relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary" 
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            Manual Add
          </NavLink>
          <NavLink 
            to="/export" 
            className={({ isActive }) => 
              isActive 
                ? "text-primary font-medium relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary" 
                : "text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            Export
          </NavLink>
        </nav>
        
        <div className="flex items-center gap-3">
          <form onSubmit={onSearch} className="hidden md:flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Search products..." 
                className="w-80 pl-10 pr-4 h-10 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <Button type="submit" size="sm" className="h-10 px-6">Search</Button>
          </form>
          
          <ModeToggle />
        </div>
        
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
