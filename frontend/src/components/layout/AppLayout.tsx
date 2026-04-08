import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  LayoutDashboard, Users, LogOut, Activity, Menu, X, DollarSign, Calendar, Stethoscope, PanelLeftClose, PanelLeft,
  UserPlus, ClipboardList,
} from 'lucide-react';

const SIDEBAR_COLLAPSED_KEY = 'prontuario-sidebar-collapsed';

const NAV_PAGES = {
  dashboard: { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  patients: { to: '/patients', icon: Users, label: 'Pacientes' },
  consultas: { to: '/consultas', icon: Stethoscope, label: 'Consultas' },
  mes: { to: '/agenda', icon: Calendar, label: 'Mês' },
  finance: { to: '/finance', icon: DollarSign, label: 'Financeiro' },
};

const crmItems = [
  { to: '/crm/seguimento', icon: ClipboardList, label: 'Seguimento' },
  { to: '/crm/leads', icon: UserPlus, label: 'Leads' },
];

export default function AppLayout() {
  const doctor = useAuthStore(s => s.doctor);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setSidebarOpen(false);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      {/* Mobile: top bar with hamburger */}
      <header className="mobile-header" aria-label="Menu principal">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu size={24} aria-hidden />
        </button>
        <span className="mobile-header-title">Prontuário Esportivo</span>
      </header>

      {/* Overlay when sidebar open on mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          onKeyDown={(e) => e.key === 'Escape' && closeSidebar()}
          role="button"
          tabIndex={0}
          aria-label="Fechar menu"
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <Activity size={20} color="var(--luz-gold)" aria-hidden />
            <div className="sidebar-logo-text-wrap">
              <div className="sidebar-logo-text">PRONTUÁRIO</div>
              <div className="sidebar-logo-sub">Terapias Esportivas</div>
            </div>
          </div>
          <div className="sidebar-logo-actions">
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={closeSidebar}
              aria-label="Fechar menu"
            >
              <X size={20} aria-hidden />
            </button>
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={() => setSidebarCollapsed(c => !c)}
              aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
              title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {sidebarCollapsed ? (
                <PanelLeft size={20} aria-hidden />
              ) : (
                <PanelLeftClose size={20} aria-hidden />
              )}
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>
            
            {/* Base nav items everyone sees */}
            <NavLink to={NAV_PAGES.dashboard.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={closeSidebar} title={sidebarCollapsed ? NAV_PAGES.dashboard.label : undefined}>
              <NAV_PAGES.dashboard.icon size={20} aria-hidden />
              <span className="nav-item-label">{NAV_PAGES.dashboard.label}</span>
            </NavLink>

            {/* Conditionally render based on permissions */}
            {(doctor?.can_access_records) && (
              <NavLink to={NAV_PAGES.patients.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={closeSidebar} title={sidebarCollapsed ? NAV_PAGES.patients.label : undefined}>
                <NAV_PAGES.patients.icon size={20} aria-hidden />
                <span className="nav-item-label">{NAV_PAGES.patients.label}</span>
              </NavLink>
            )}

            <NavLink to={NAV_PAGES.consultas.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={closeSidebar} title={sidebarCollapsed ? NAV_PAGES.consultas.label : undefined}>
              <NAV_PAGES.consultas.icon size={20} aria-hidden />
              <span className="nav-item-label">{NAV_PAGES.consultas.label}</span>
            </NavLink>

            <NavLink to={NAV_PAGES.mes.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={closeSidebar} title={sidebarCollapsed ? NAV_PAGES.mes.label : undefined}>
              <NAV_PAGES.mes.icon size={20} aria-hidden />
              <span className="nav-item-label">{NAV_PAGES.mes.label}</span>
            </NavLink>

            <NavLink to={NAV_PAGES.finance.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={closeSidebar} title={sidebarCollapsed ? NAV_PAGES.finance.label : undefined}>
              <NAV_PAGES.finance.icon size={20} aria-hidden />
              <span className="nav-item-label">{NAV_PAGES.finance.label}</span>
            </NavLink>
          </div>
          <div className="nav-section">
            <div className="nav-section-title">CRM</div>
            {crmItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                onClick={closeSidebar}
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon size={20} aria-hidden />
                <span className="nav-item-label">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Doctor info + logout */}
        <div className="sidebar-footer">
          {doctor && (
            <div className="sidebar-footer-doctor">
              <div className="sidebar-footer-doctor-name">{doctor.name}</div>
              <div className="sidebar-footer-doctor-crm" style={{ marginBottom: 6 }}>
                {doctor.can_access_records ? `CRM ${doctor.crm} · Médico responsável` : 'Secretária'}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {doctor.can_access_records && (
                  <span style={{ fontSize: 9, padding: '2px 4px', background: 'rgba(52, 168, 83, 0.2)', color: '#34a853', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prontuário</span>
                )}
                {doctor.can_edit_agenda && (
                  <span style={{ fontSize: 9, padding: '2px 4px', background: 'rgba(66, 133, 244, 0.2)', color: '#4285f4', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agenda</span>
                )}
              </div>
            </div>
          )}
          <button type="button" className="btn btn-ghost btn-sm nav-logout-btn" onClick={handleLogout} title="Sair">
            <LogOut size={18} aria-hidden />
            <span className="nav-item-label">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
