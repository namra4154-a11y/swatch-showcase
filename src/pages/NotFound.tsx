import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    document.title = "Page Not Found – Sheth's ";
  }, [location.pathname]);

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-md mx-auto px-4">
        <Card className="border-border/50 text-center">
          <CardContent className="p-12 space-y-6">
            {/* 404 Icon */}
            <div className="relative">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl font-bold text-primary">404</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-destructive">!</span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
              <p className="text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 font-mono">
                {location.pathname}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate(-1)} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button 
                onClick={() => navigate("/")} 
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </div>

            {/* Quick Links */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Quick Navigation:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/products")}
                  className="text-xs h-8 px-3"
                >
                  <Search className="h-3 w-3 mr-1" />
                  Products
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/add")}
                  className="text-xs h-8 px-3"
                >
                  Add Product
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/export")}
                  className="text-xs h-8 px-3"
                >
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default NotFound;
