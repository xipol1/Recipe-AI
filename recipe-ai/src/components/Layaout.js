import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  Home,
  Camera,
  Package,
  Sparkles,
  Users,
  Leaf
} from "lucide-react";
import DespensaLogo from "./UI/DespensaLogo";

const navigationItems = [
  {
    name: "Dashboard",
    href: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    name: "Escanear Ticket",
    href: createPageUrl("ScanTicket"),
    icon: Camera,
  },
  {
    name: "Mi Despensa",
    href: createPageUrl("MyPantry"),
    icon: Package,
  },
  {
    name: "Recetas con IA",
    href: createPageUrl("AIRecipes"),
    icon: Sparkles,
  },
  {
    name: "Comunidad",
    href: createPageUrl("CommunityRecipes"),
    icon: Users,
  },
];

const pageTitles = {
    "Dashboard": "Dashboard",
    "ScanTicket": "Escanear Ticket",
    "MyPantry": "Mi Despensa",
    "AIRecipes": "Recetas con IA",
    "CommunityRecipes": "Recetas de la Comunidad"
}

// --- Componente de la Barra Lateral para Escritorio ---
const DesktopSidebar = ({ currentPageName }) => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-green-100">
           <DespensaLogo className="w-10 h-10" showText={true} />
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto bg-white">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  ${location.pathname === item.href
                    ? 'bg-green-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors
                `}
              >
                <item.icon
                  className={`
                    ${location.pathname === item.href ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-500'}
                    mr-3 flex-shrink-0 h-5 w-5
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
            <div className="flex-shrink-0 flex border-t border-green-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">¡Cocina sostenible!</p>
                    <p className="text-xs text-green-600 truncate">Reduce desperdicios</p>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </aside>
  );
};

// --- Componente de Navegación Inferior para Móvil ---
const BottomNavBar = ({ currentPageName }) => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-lg z-50">
      <div className="flex justify-around">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`
              flex-1 flex flex-col items-center justify-center p-2 text-xs
              ${location.pathname === item.href ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-600'}
              transition-colors
            `}
          >
            <item.icon className="h-5 w-5 mb-1" aria-hidden="true" />
            <span className="truncate w-full text-center">{item.name === "Recetas de la Comunidad" ? "Comunidad" : item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};


export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <div className="flex h-screen overflow-hidden">
        {/* Barra lateral para escritorio */}
        <DesktopSidebar currentPageName={currentPageName} />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Cabecera para móvil */}
          <header className="md:hidden bg-white border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                <DespensaLogo className="w-8 h-8" />
                <h1 className="text-lg font-bold text-gray-800">{pageTitles[currentPageName] || "DespensaIA"}</h1>
                <div className="w-8 h-8" /> {/* Spacer for centering */}
              </div>
            </div>
          </header>

          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            {/* El padding inferior pb-16 es para que el contenido no quede oculto por la barra de navegación inferior en móvil */}
            <div className="py-6 px-4 sm:px-6 lg:px-8 pb-20 md:pb-6">
              {children}
            </div>
          </main>
        </div>

        {/* Barra de navegación inferior para móvil */}
        <BottomNavBar currentPageName={currentPageName} />
      </div>
    </div>
  );
}