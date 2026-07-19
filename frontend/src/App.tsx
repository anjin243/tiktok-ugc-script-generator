import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { PageTransition } from "@/components/PageTransition";
import Index from "./pages/Index";
import Create from "./pages/Create";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";
import UgcExport from "./pages/UgcExport";
import AiVideo from "./pages/AiVideo";

/**
 * Configure TanStack Query client with optimized defaults
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 1 minute
      staleTime: 60 * 1000,
      // Cache data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AnimatedRoutes>
            <Route path="/" data-genie-title="Home Page" data-genie-key="Home" element={<PageTransition transition="slide-up"><Index /></PageTransition>} />
            <Route path="/create" data-genie-title="Create Project" data-genie-key="Create" element={<PageTransition transition="fade"><Create /></PageTransition>} />
            <Route path="/projects" data-genie-title="My Projects" data-genie-key="Projects" element={<PageTransition transition="fade"><Projects /></PageTransition>} />
            <Route path="/ugc-export" data-genie-title="UGC MP4 Export" data-genie-key="UgcExport" element={<PageTransition transition="fade"><UgcExport /></PageTransition>} />
            <Route path="/ai-video" data-genie-title="Human AI Video" data-genie-key="AiVideo" element={<PageTransition transition="fade"><AiVideo /></PageTransition>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" data-genie-key="NotFound" data-genie-title="Not Found" element={<PageTransition transition="fade"><NotFound /></PageTransition>} />
          </AnimatedRoutes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App
