import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import FuelExpenses from './pages/FuelExpenses';
import Reports from './pages/Reports';
import StaffAccounts from './pages/StaffAccounts';
import { ROLES } from './utils/roles';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute roles={[ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST]}>
              <Vehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles/:id"
          element={
            <ProtectedRoute roles={[ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST]}>
              <VehicleDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/drivers"
          element={
            <ProtectedRoute roles={[ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER]}>
              <Drivers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <ProtectedRoute roles={[ROLES.FLEET_MANAGER, ROLES.DRIVER]}>
              <Trips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute roles={[ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER]}>
              <Maintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fuel-expenses"
          element={
            <ProtectedRoute roles={[ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST]}>
              <FuelExpenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={[ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST, ROLES.SAFETY_OFFICER]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={[ROLES.FLEET_MANAGER]}>
              <StaffAccounts />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Login />} />
    </Routes>
  );
}

export default App;
