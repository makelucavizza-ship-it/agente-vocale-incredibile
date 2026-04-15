import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/calendar", label: "Calendario" },
  { href: "/dashboard/calls", label: "Chiamate" },
  { href: "/dashboard/clients", label: "Clienti" },
  { href: "/dashboard/settings", label: "Impostazioni" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200">
          <p className="font-semibold text-gray-900 text-sm">Centro Estetico</p>
          <p className="text-xs text-gray-400 mt-0.5">Armonia</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">Giulia — Agente vocale</p>
          <span className="inline-flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            <span className="text-xs text-green-600">Attiva</span>
          </span>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
