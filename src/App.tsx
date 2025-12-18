import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import OrganizationStructure from "./pages/OrganizationStructure";
import WorkflowApproval from "./pages/WorkflowApproval";
import MeetingBooking from "./pages/MeetingBooking";
import NotificationCenter from "./pages/NotificationCenter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/users" element={<MainLayout><UserManagement /></MainLayout>} />
          <Route path="/organization" element={<MainLayout><OrganizationStructure /></MainLayout>} />
          <Route path="/workflow" element={<MainLayout><WorkflowApproval /></MainLayout>} />
          <Route path="/meetings" element={<MainLayout><MeetingBooking /></MainLayout>} />
          <Route path="/notifications" element={<MainLayout><NotificationCenter /></MainLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
