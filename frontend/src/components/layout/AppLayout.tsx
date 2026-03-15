import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  LayoutDashboard, Users, FileText, FlaskConical,
  Camera, LogOut, Activity
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/patients', icon: Users, label: 'Pacientes' },
];

export default function AppLayout() {
  const { doctor, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={20} color="#c9a44a" />
            <div>
              <div className="sidebar-logo-text">PRONTUÁRIO</div>
              <div style={{ fontSize: 10, color: '#a0a0a0', letterSpacing: '0.05em' }}>
                LuzPerformance
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Doctor info + logout */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(201,164,74,0.15)',
        }}>
          {doctor && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{doctor.name}</div>
              <div style={{ fontSize: 11, color: '#a0a0a0' }}>CRM {doctor.crm}</div>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%' }}>
            <LogOut size={14} />
            Sair
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
