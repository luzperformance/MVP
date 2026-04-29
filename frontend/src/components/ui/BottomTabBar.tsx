import React from 'react';
import { Users, Calendar, Stethoscope, DollarSign, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface BottomTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const BOTTOM_TABS: BottomTab[] = [
  { id: 'patients', label: 'Pacientes', icon: Users },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'consultas', label: 'Consultas', icon: Stethoscope },
  { id: 'finance', label: 'Financeiro', icon: DollarSign },
  { id: 'crm', label: 'CRM', icon: Target },
];

interface BottomTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      className="
        lg:hidden
        fixed bottom-0 left-0 right-0 z-30
        bg-[#1c1c1e]/90 backdrop-blur-2xl
        border-t border-white/[0.06]
      "
    >
      <div
        className="flex items-stretch justify-around"
        style={{ height: 56, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {BOTTOM_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center
                flex-1 min-w-0 gap-0.5
                transition-colors duration-200
                ${isActive ? 'text-primary' : 'text-white/40 active:text-white/60'}
              `}
            >
              <div className="relative flex flex-col items-center gap-0.5">
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {isActive && (
                  <span className="absolute -bottom-1.5 h-[3px] w-[3px] rounded-full bg-primary" />
                )}
                <span className="text-[10px] font-medium leading-tight">
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default React.memo(BottomTabBar);