import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <NavLink to="/" className="font-semibold tracking-tight">
          Swatch Showcase
        </NavLink>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/products" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>Catalog</NavLink>
          <NavLink to="/add" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>Manual Add</NavLink>
          <NavLink to="/export" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>Export</NavLink>
        </nav>
        <form onSubmit={onSearch} className="hidden md:flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="w-72"/>
          <Button type="submit">Search</Button>
        </form>
      </div>
    </header>
  );
}
