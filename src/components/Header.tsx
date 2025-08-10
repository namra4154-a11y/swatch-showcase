import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Search, Menu, X } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQ(params.get("q") ?? "");
  }, [location.search]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    navigate(`/products?${params.toString()}`);
    setMobileMenuOpen(false); // Close mobile menu after search
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <NavLink to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Sheth's </span>
        </NavLink>
        
        {/* Desktop Navigation */}
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
          {/* Desktop Search */}
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
          
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="container py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={onSearch} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                  placeholder="Search products..." 
                  className="pl-10 pr-4 h-10 bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <Button type="submit" size="sm" className="w-full h-10">Search</Button>
            </form>

            {/* Mobile Navigation Links */}
            <nav className="space-y-2">
              <NavLink 
                to="/products" 
                className={({ isActive }) => 
                  `block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
                onClick={closeMobileMenu}
              >
                Catalog
              </NavLink>
              <NavLink 
                to="/add" 
                className={({ isActive }) => 
                  `block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
                onClick={closeMobileMenu}
              >
                Manual Add
              </NavLink>
              <NavLink 
                to="/export" 
                className={({ isActive }) => 
                  `block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
                onClick={closeMobileMenu}
              >
                Export
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
