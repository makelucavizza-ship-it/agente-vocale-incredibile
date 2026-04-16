import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-56 p-4 md:p-8 pb-20 md:pb-8 overflow-auto">{children}</main>
      <MobileNav />
    </div>
  );
}
