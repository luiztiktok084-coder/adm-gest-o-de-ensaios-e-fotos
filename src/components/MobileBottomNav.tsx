import React from 'react';
import {
  LayoutDashboard,
  FolderHeart,
  Users,
  ImagePlus,
  HeartHandshake,
  PackageCheck,
  Menu,
} from 'lucide-react';
import { NavView } from './Sidebar';
import { Client } from '../types';

interface MobileBottomNavProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenSidebar: () => void;
  clients: Client[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenSidebar,
  clients,
}) => {
  // Notification badges
  const awaitingCount = clients.filter((c) => c.status === 'Aguardando seleção').length;
  const chosenCount = clients.filter((c) => c.status === 'Selecionado').length;
  const inProdCount = clients.filter((c) => c.status === 'Em produção').length;

  const items = [
    {
      id: 'dashboard' as NavView,
      label: 'Painel',
      icon: LayoutDashboard,
    },
    {
      id: 'clients' as NavView,
      label: 'Clientes',
      icon: Users,
      badge: awaitingCount > 0 ? awaitingCount : undefined,
      badgeColor: 'bg-amber-500 text-zinc-950',
    },
    {
      id: 'categories' as NavView,
      label: 'Galerias',
      icon: FolderHeart,
    },
    {
      id: 'chosen_photos' as NavView,
      label: 'Escolhas',
      icon: HeartHandshake,
      badge: chosenCount > 0 ? chosenCount : undefined,
      badgeColor: 'bg-emerald-500 text-zinc-950',
    },
    {
      id: 'final_delivery' as NavView,
      label: 'Entrega',
      icon: PackageCheck,
      badge: inProdCount > 0 ? inProdCount : undefined,
      badgeColor: 'bg-purple-500 text-white',
    },
  ];

  return (
    <nav
      aria-label="Navegação móvel"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800/90 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectView(item.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] cursor-pointer ${
              isActive
                ? 'text-amber-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-amber-400' : ''} transition-transform`} />
              {item.badge !== undefined && (
                <span
                  className={`absolute -top-1.5 -right-2.5 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ${item.badgeColor} shadow-xs`}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 leading-tight tracking-tight">
              {item.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 bg-amber-400 rounded-full mt-0.5" />
            )}
          </button>
        );
      })}

      {/* Menu / Mais button */}
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all min-w-[54px] cursor-pointer"
        aria-label="Mais opções e configurações"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 leading-tight">Mais</span>
      </button>
    </nav>
  );
};
