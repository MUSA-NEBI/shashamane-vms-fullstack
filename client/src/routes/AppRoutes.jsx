import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Public pages
import LandingPage      from '../pages/public/LandingPage';
import LoginPage        from '../pages/auth/LoginPage';
import RegisterPage     from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from '../pages/auth/ResetPasswordPage';
import UnauthorizedPage   from '../pages/public/UnauthorizedPage';
import NotFoundPage       from '../pages/public/NotFoundPage';

// Admin pages
import AdminDashboard   from '../pages/admin/AdminDashboard';
import VehiclesPage     from '../pages/admin/VehiclesPage';
import DriversPage      from '../pages/admin/DriversPage';
import RoutesPage       from '../pages/admin/RoutesPage';
import SchedulesPage    from '../pages/admin/SchedulesPage';
import ScheduleTemplatesPage from '../pages/admin/ScheduleTemplatesPage';
import BookingsPage     from '../pages/admin/BookingsPage';
import PaymentsPage     from '../pages/admin/PaymentsPage';
import TicketsPage      from '../pages/admin/TicketsPage';
import MaintenancePage  from '../pages/admin/MaintenancePage';
import UsersPage        from '../pages/admin/UsersPage';
import ReportsPage      from '../pages/admin/ReportsPage';

// Dispatcher pages
import DispatcherDashboard from '../pages/dispatcher/DispatcherDashboard';
import DispatcherSchedules from '../pages/dispatcher/DispatcherSchedules';
import DispatcherVehicles  from '../pages/dispatcher/DispatcherVehicles';
import DispatcherDrivers   from '../pages/dispatcher/DispatcherDrivers';
import DispatcherBookings  from '../pages/dispatcher/DispatcherBookings';
import MaintenanceReports  from '../pages/dispatcher/MaintenanceReports';

// Driver pages
import DriverDashboard from '../pages/driver/DriverDashboard';
import DriverTrips     from '../pages/driver/DriverTrips';

// Passenger pages
import TripSearchPage     from '../pages/passenger/TripSearchPage';
import SeatSelectionPage  from '../pages/passenger/SeatSelectionPage';
import PassengerBookings  from '../pages/passenger/PassengerBookings';
import BookingDetailPage  from '../pages/passenger/BookingDetailPage';
import PassengerTickets   from '../pages/passenger/PassengerTickets';
import TicketDetailPage   from '../pages/passenger/TicketDetailPage';
import PassengerProfile   from '../pages/passenger/PassengerProfile';

// Role-based redirect after login
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const paths = {
    admin:      '/admin/dashboard',
    dispatcher: '/dispatcher/dashboard',
    driver:     '/driver/dashboard',
    passenger:  '/passenger/search',
  };
  return <Navigate to={paths[user.role] || '/login'} replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/"               element={<LandingPage />} />
    <Route path="/login"          element={<LoginPage />} />
    <Route path="/register"       element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password"  element={<ResetPasswordPage />} />
    <Route path="/unauthorized"   element={<UnauthorizedPage />} />
    <Route path="/dashboard"      element={<RoleRedirect />} />

    {/* Admin */}
    <Route element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/admin/dashboard"   element={<AdminDashboard />} />
      <Route path="/admin/users"       element={<UsersPage />} />
      <Route path="/admin/vehicles"    element={<VehiclesPage />} />
      <Route path="/admin/drivers"     element={<DriversPage />} />
      <Route path="/admin/routes"      element={<RoutesPage />} />
      <Route path="/admin/schedules"   element={<SchedulesPage />} />
      <Route path="/admin/templates"   element={<ScheduleTemplatesPage />} />
      <Route path="/admin/bookings"    element={<BookingsPage />} />
      <Route path="/admin/payments"    element={<PaymentsPage />} />
      <Route path="/admin/tickets"     element={<TicketsPage />} />
      <Route path="/admin/maintenance" element={<MaintenancePage />} />
      <Route path="/admin/reports"     element={<ReportsPage />} />
    </Route>

    {/* Dispatcher */}
    <Route element={<ProtectedRoute allowedRoles={['admin','dispatcher']}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/dispatcher/dashboard" element={<DispatcherDashboard />} />
      <Route path="/dispatcher/schedules" element={<DispatcherSchedules />} />
      <Route path="/dispatcher/vehicles"  element={<DispatcherVehicles />} />
      <Route path="/dispatcher/drivers"   element={<DispatcherDrivers />} />
      <Route path="/dispatcher/bookings"  element={<DispatcherBookings />} />
      <Route path="/dispatcher/maintenance" element={<MaintenanceReports />} />
    </Route>

    {/* Driver */}
    <Route element={<ProtectedRoute allowedRoles={['admin','driver']}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/driver/dashboard" element={<DriverDashboard />} />
      <Route path="/driver/trips"     element={<DriverTrips />} />
    </Route>

    {/* Passenger */}
    <Route element={<ProtectedRoute allowedRoles={['passenger','admin']}><DashboardLayout /></ProtectedRoute>}>
      <Route path="/passenger/search"              element={<TripSearchPage />} />
      <Route path="/passenger/seat/:scheduleId"    element={<SeatSelectionPage />} />
      <Route path="/passenger/bookings"            element={<PassengerBookings />} />
      <Route path="/passenger/bookings/:id"        element={<BookingDetailPage />} />
      <Route path="/passenger/tickets"             element={<PassengerTickets />} />
      <Route path="/passenger/tickets/:id"         element={<TicketDetailPage />} />
      <Route path="/passenger/profile"             element={<PassengerProfile />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;
