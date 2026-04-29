import React, { useRef } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'segmented' | 'underline';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

const Tabs: React.FC<TabsProps> = React.memo(
  ({
    tabs,
    activeTab,
    onChange,
    variant = 'segmented',
    size = 'md',
    fullWidth = variant === 'segmented',
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const sizeClasses = {
      sm: {
        container: 'text-xs',
        pill: 'py-1 px-3 text-xs',
        underline: 'py-2 px-3 text-xs',
      },
      md: {
        container: 'text-sm',
        pill: 'py-1.5 px-4 text-sm',
        underline: 'py-2.5 px-4 text-sm',
      },
    };

    if (variant === 'segmented') {
      return (
        <div
          ref={scrollRef}
          className={`
            overflow-x-auto scrollbar-hide
            bg-white/[0.04] rounded-xl p-1
            ${fullWidth ? 'flex' : 'inline-flex'}
            ${sizeClasses[size].container}
          `}
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
          `}</style>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`
                  relative flex items-center justify-center gap-1.5
                  whitespace-nowrap rounded-lg
                  transition-all duration-200 ease-out
                  ${sizeClasses[size].pill}
                  ${fullWidth ? 'flex-1' : ''}
                  ${isActive
                    ? 'bg-[#007AFF] text-white shadow-sm'
                    : 'text-white/60 hover:text-white bg-transparent'
                  }
                `}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-[#007AFF]/20 text-[#007AFF] text-[0.625rem] leading-none ml-1 px-1 rounded">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      );
    }

    // Underline variant
    return (
      <div
        ref={scrollRef}
        className={`
          overflow-x-auto scrollbar-hide
          border-b border-white/[0.06]
          ${fullWidth ? 'flex' : 'inline-flex'}
          ${sizeClasses[size].container}
        `}
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                relative flex items-center justify-center gap-1.5
                whitespace-nowrap
                transition-colors duration-200 ease-out
                ${sizeClasses[size].underline}
                ${fullWidth ? 'flex-1' : ''}
                ${isActive
                  ? 'text-white'
                  : 'text-white/60 hover:text-[#007AFF]'
                }
              `}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="bg-[#007AFF]/20 text-[#007AFF] text-[0.625rem] leading-none ml-1 px-1 rounded">
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF] rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

export default Tabs;