import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { SpaceBackground } from "@/components/SpaceBackground";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import EventPlanner from "./pages/EventPlanner";
import ExpenseTracker from "./pages/ExpenseTracker";
import DebtManager from "./pages/DebtManager";
import Portfolio from "./pages/Portfolio";
import Reports from "./pages/Reports";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<EventPlanner />} />
          <Route path="/expenses" element={<ExpenseTracker />} />
          <Route path="/debts" element={<DebtManager />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" toastOptions={{ className: 'bg-card border-border text-foreground' }} />
      <BrowserRouter>
        <SpaceBackground />
        <AppLayout>
          <AnimatedRoutes />
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
