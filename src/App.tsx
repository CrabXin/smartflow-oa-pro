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
            <Route
              path="/"
              element={
                <AuthGuard>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/users"
              element={
                <AuthGuard>
                  <MainLayout>
                    <UserManagement />
                  </MainLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/organization"
              element={
                <AuthGuard>
                  <MainLayout>
                    <OrganizationStructure />
                  </MainLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/workflow"
              element={
                <AuthGuard>
                  <MainLayout>
                    <WorkflowApproval />
                  </MainLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/meetings"
              element={
                <AuthGuard>
                  <MainLayout>
                    <MeetingBooking />
                  </MainLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/notifications"
              element={
                <AuthGuard>
                  <MainLayout>
                    <NotificationCenter />
                  </MainLayout>
                </AuthGuard>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
