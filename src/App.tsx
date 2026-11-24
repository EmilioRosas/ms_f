import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import EntityAPage from './pages/entity-a/EntityAPage';
import EntityBPage from './pages/entity-b/EntityBPage';
import AsignaturasPage from './pages/asignaturas/AsignaturasPage';
import ServicioSocialPage from './pages/serviciosocial/ServicioSocialPage';
import NotFound from './pages/NotFound';
import AlumnoPage from './pages/alumno/AlumnoPage';
import MaestrosPage from './pages/maestros/MaestrosPage';
import GruposPage from './pages/grupos/GruposPage';

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
          <Route path="/alumno" element={<AlumnoPage />} />       {/* ALUMNOS CRUD */}
          <Route path="/asignaturas" element={<AsignaturasPage />} /> {/* ASIGNATURAS CRUD */}
          <Route path="/maestros" element={<MaestrosPage />} />   {/* MAESTROS + detalle */}
          <Route path="/grupos" element={<GruposPage />} />       {/* GRUPOS + detalle */}
          <Route path="/servicio-social" element={<ServicioSocialPage />} />
        </Route>
      </Route>

      <Route path="/inicio" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
