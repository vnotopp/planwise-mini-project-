import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 font-display text-6xl font-extrabold text-gradient-gold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Page not found</p>
        <a href="/" className="text-primary underline hover:text-secondary transition-colors font-mono text-sm">
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
