import { PrismaClient } from "@prisma/client";
import Navbar from "@/components/shared/Navbar";
import Sidebar from "@/components/Sidebar";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branches = await prisma.branch.findMany();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* nic සහ password මෙතැනින් යවන්නේ නැත */}
      <Sidebar branches={branches} />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
          <Navbar />
        </header>

        <main className="p-6 lg:p-10 flex-1 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}