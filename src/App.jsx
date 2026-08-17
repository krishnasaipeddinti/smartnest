import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

//new commit

import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import NotFoundPage from "./pages/shared/NotFoundPage";
import UnauthorizedPage from "./pages/shared/UnauthorizedPage";

import DashboardLayout from "./layouts/DashboardLayout";

/* ---------------- Admin Pages ---------------- */
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentsPage from "./pages/admin/StudentsPage";
import RoomsManagementPage from "./pages/admin/RoomsManagementPage";
import FeesManagementPage from "./pages/admin/FeesManagementPage";
import ComplaintsManagementPage from "./pages/admin/ComplaintsManagementPage";
import NoticesManagementPage from "./pages/admin/NoticesManagementPage";
import LeaveManagementPage from "./pages/admin/LeaveManagementPage";
import FoodMenuManagementPage from "./pages/admin/FoodMenuManagementPage";

/* ---------------- Warden Pages ---------------- */
import WardenDashboard from "./pages/warden/WardenDashboard";
import WardenStudentsPage from "./pages/warden/WardenStudentsPage";
import WardenRoomsPage from "./pages/warden/WardenRoomsPage";
import WardenFeesPage from "./pages/warden/WardenFeesPage";
import WardenComplaintsPage from "./pages/warden/WardenComplaintsPage";
import WardenNoticesPage from "./pages/warden/WardenNoticesPage";
import WardenLeavePage from "./pages/warden/WardenLeavePage";
import WardenFoodMenuPage from "./pages/warden/WardenFoodMenuPage";

/* ---------------- Student Pages ---------------- */
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentFeesPage from "./pages/student/StudentFeesPage";
import StudentComplaintsPage from "./pages/student/StudentComplaintsPage";
import StudentLeavePage from "./pages/student/StudentLeavePage";
import StudentFoodMenuPage from "./pages/student/StudentFoodMenuPage";
import StudentNoticesPage from "./pages/student/StudentNoticesPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<StudentsPage />} />
              <Route path="/admin/rooms" element={<RoomsManagementPage />} />
              <Route path="/admin/fees" element={<FeesManagementPage />} />
              <Route
                path="/admin/complaints"
                element={<ComplaintsManagementPage />}
              />
              <Route path="/admin/notices" element={<NoticesManagementPage />} />
              <Route path="/admin/leaves" element={<LeaveManagementPage />} />
              <Route
                path="/admin/food-menu"
                element={<FoodMenuManagementPage />}
              />
            </Route>
          </Route>

          {/* Warden */}
          <Route element={<ProtectedRoute allowedRoles={["warden"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/warden" element={<WardenDashboard />} />
              <Route path="/warden/students" element={<WardenStudentsPage />} />
              <Route path="/warden/rooms" element={<WardenRoomsPage />} />
              <Route path="/warden/fees" element={<WardenFeesPage />} />
              <Route
                path="/warden/complaints"
                element={<WardenComplaintsPage />}
              />
              <Route path="/warden/notices" element={<WardenNoticesPage />} />
              <Route path="/warden/leaves" element={<WardenLeavePage />} />
              <Route
                path="/warden/food-menu"
                element={<WardenFoodMenuPage />}
              />
            </Route>
          </Route>

          {/* Student */}
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/fees" element={<StudentFeesPage />} />
              <Route
                path="/student/complaints"
                element={<StudentComplaintsPage />}
              />
              <Route path="/student/leaves" element={<StudentLeavePage />} />
              <Route
                path="/student/food-menu"
                element={<StudentFoodMenuPage />}
              />
              <Route path="/student/notices" element={<StudentNoticesPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;