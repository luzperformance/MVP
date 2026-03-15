import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import AppLayout from './components/layout/AppLayout';

// Lazy-loaded pages
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const PatientsPage     = lazy(() => import('./pages/PatientsPage'));
const PatientDetailPage = lazy(() => import('./pages/PatientDetailPage'));
const NewRecordPage    = lazy(() => import('./pages/NewRecordPage'));
const ExamDashboardPage = lazy(() => import('./pages/ExamDashboardPage'));
const SetupPage        = lazy(() => import('./pages/SetupPage'));

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <div style={{ color: '#c9a44a', fontFamily: 'Montserrat', fontSize: 14 }}>Carregando...</div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/" element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:id" element={<PatientDetailPage />} />
            <Route path="patients/:id/records/new" element={<NewRecordPage />} />
            <Route path="patients/:id/exams" element={<ExamDashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
