import React, { lazy, Suspense, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import AppLayout from './views/components/layout/AppLayout';

const LoginPage            = lazy(() => import('./views/pages/LoginPage'));
const DashboardPage        = lazy(() => import('./views/pages/DashboardPage'));
const PatientsPage         = lazy(() => import('./views/pages/PatientsPage'));
const PatientDetailPage    = lazy(() => import('./views/pages/PatientDetailPage'));
const NewRecordPage        = lazy(() => import('./views/pages/NewRecordPage'));
const ExamDashboardPage    = lazy(() => import('./views/pages/ExamDashboardPage'));
const FinanceDashboardPage = lazy(() => import('./views/pages/FinanceDashboardPage'));
const AgendaPage           = lazy(() => import('./views/pages/AgendaPage'));
const ConsultasPage        = lazy(() => import('./views/pages/ConsultasPage'));
const NewPatientPage       = lazy(() => import('./views/pages/NewPatientPage'));
const SetupPage            = lazy(() => import('./views/pages/SetupPage'));
const LeadsPage            = lazy(() => import('./views/pages/LeadsPage'));
const LeadDetailPage       = lazy(() => import('./views/pages/LeadDetailPage'));
const AssetsPage           = lazy(() => import('./views/pages/AssetsPage'));
const GestaoPage           = lazy(() => import('./views/pages/GestaoPage'));

function AuthGuard({ children }: { children: ReactNode }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <div className="finance-loading-spinner" aria-hidden />
  </div>
);

interface ErrorBoundaryState { hasError: boolean; error: Error | null }

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 24 }}>
          <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: 32 }}>
            <h2 style={{ color: 'var(--luz-gold)', marginBottom: 12 }}>Algo deu errado</h2>
            <p style={{ color: 'var(--luz-gray)', fontSize: 14, marginBottom: 20 }}>
              {this.state.error?.message || 'Erro inesperado na aplicação.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
            >
              Voltar ao início
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/" element={<AuthGuard><AppLayout /></AuthGuard>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="patients/new" element={<NewPatientPage />} />
              <Route path="patients/:id" element={<PatientDetailPage />} />
              <Route path="patients/:id/records/new" element={<NewRecordPage />} />
              <Route path="patients/:id/exams" element={<ExamDashboardPage />} />
              <Route path="finance" element={<FinanceDashboardPage />} />
              <Route path="consultas" element={<ConsultasPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="crm/leads" element={<LeadsPage />} />
              <Route path="crm/leads/:id" element={<LeadDetailPage />} />
              <Route path="crm/assets" element={<AssetsPage />} />
              <Route path="crm/seguimento" element={<GestaoPage />} />
              <Route path="gestao" element={<Navigate to="/crm/seguimento" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
