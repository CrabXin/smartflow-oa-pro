import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { AuthGuard } from "./auth/AuthGuard";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import OrganizationStructure from "./pages/OrganizationStructure";
import WorkflowApproval from "./pages/WorkflowApproval";
import MeetingBooking from "./pages/MeetingBooking";
import NotificationCenter from "./pages/NotificationCenter";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<AuthGuard />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route
                  path="/organization"
                  element={<OrganizationStructure />}
                />
                <Route path="/workflow" element={<WorkflowApproval />} />
                <Route path="/meetings" element={<MeetingBooking />} />
                <Route path="/notifications" element={<NotificationCenter />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
