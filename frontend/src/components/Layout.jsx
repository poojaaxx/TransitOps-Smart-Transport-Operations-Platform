import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users as UsersIcon,
  Route as RouteIcon,
  Wrench,
  Fuel,
  FileBarChart,
  UserCog,
  Moon,
  Sun,
  LogOut,
  Menu,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLES, ROLE_LABELS } from '../utils/roles';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: Object.values(ROLES) },
  { to: '/vehicles', label: 'Vehicles', icon: Truck, roles: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST] },
  { to: '/drivers', label: 'Drivers', icon: UsersIcon, roles: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER] },
  { to: '/trips', label: 'Trips', icon: RouteIcon, roles: [ROLES.FLEET_MANAGER, ROLES.DRIVER] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER] },
  { to: '/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel, roles: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST, ROLES.SAFETY_OFFICER] },
  { to: '/users', label: 'Staff Accounts', icon: UserCog, roles: [ROLES.FLEET_MANAGER] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  const NavContent = (
    <>
      <div className="px-4 py-5">
        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">TransitOps</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Smart Transport Operations</p>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        <div className="mb-2 px-1">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{user.name}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[user.role]}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={logout}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 md:flex">
        {NavContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-64 flex-col bg-white dark:bg-slate-900">{NavContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-slate-600 dark:text-slate-300">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-slate-900 dark:text-slate-100">TransitOps</span>
          <div className="w-6" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
