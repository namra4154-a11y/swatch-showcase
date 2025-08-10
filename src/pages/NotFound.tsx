import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, RefreshCw } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    document.title = "Page Not Found - Sheth's";
    
    // Auto-redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoHome = () => {
    setIsRedirecting(true);
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-4xl">⚠️</span>
              </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist.
            </p>
            <p className="text-sm text-muted-foreground">
              Attempted to access: <code className="bg-muted px-2 py-1 rounded text-xs">{location.pathname}</code>
            </p>
            {countdown > 0 && (
              <p className="text-sm text-primary">
                Redirecting to home in {countdown} seconds...
              </p>
            )}
            </div>

            <div className="space-y-3">
            <Button 
              onClick={handleGoHome} 
              className="w-full" 
              disabled={isRedirecting}
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
            
              <Button 
                variant="outline" 
              onClick={handleGoBack} 
              className="w-full"
              disabled={isRedirecting}
              >
              <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            
              <Button 
              variant="ghost" 
              onClick={handleRefresh} 
              className="w-full"
              disabled={isRedirecting}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
              </Button>
            </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>If this problem persists, try:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Clearing your browser cache</li>
              <li>Checking your internet connection</li>
              <li>Contacting support if the issue continues</li>
            </ul>
            </div>
          </CardContent>
        </Card>
    </main>
  );
}
