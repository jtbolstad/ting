import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { OrganizationProvider } from "./context/OrganizationContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { ToastProvider } from "./components/ui/Toast";
import { ConfirmProvider } from "./components/ui/ConfirmModal";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Catalog } from "./pages/Catalog";
import { ItemDetail } from "./pages/ItemDetail";
import { Dashboard } from "./pages/Dashboard";
import { AddItem } from "./pages/AddItem";
import { EditItem } from "./pages/EditItem";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { TermsOfService } from "./pages/TermsOfService";
import { Profile } from "./pages/Profile";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <OrganizationProvider>
        <AuthProvider>
          <ToastProvider>
          <ConfirmProvider>
          <div className="min-h-screen bg-gray-50">
            <a href="#main-content" className="skip-link">Hopp til innhold</a>
            <Navbar />
            <WelcomeBanner />
            <main id="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/catalog" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route
                path="/items/add"
                element={
                  <ProtectedRoute>
                    <AddItem />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/items/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditItem />
                  </ProtectedRoute>
                }
              />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/overview"
                element={
                  <ProtectedRoute requirePlatformAdmin>
                    <AdminOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </main>
          </div>
          </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </OrganizationProvider>
    </BrowserRouter>
  );
}

export default App;
