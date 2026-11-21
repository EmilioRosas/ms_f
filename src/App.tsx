import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import EntityAPage from './pages/entity-a/EntityAPage';
import EntityBPage from './pages/entity-b/EntityBPage';
import AsignaturasPage from './pages/asignaturas/AsignaturasPage';
import CombinedPage from './pages/combined/CombinedPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />

      {/* Privadas: requieren access token */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entity-a" element={<EntityAPage />} />   {/* MS-A CRUD */}
          <Route path="/entity-b" element={<EntityBPage />} />   {/* MS-B CRUD */}
          {/* <Route path="/combinado" element={<CombinedPage />} /> MS-B /con-a (Feign) */}
          <Route path="/asignaturas" element={<AsignaturasPage />} />
        </Route>
      </Route>

      <Route path="/inicio" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
