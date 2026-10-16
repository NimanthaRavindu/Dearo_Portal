import { prisma } from "@/lib/db";


export default async function DashboardPage() {
  const branches = await prisma.branch.findMany({
    include: {
      _count: {
        select: {
          documentrequest: true,
          account: true,
          loan: true,
          investment: true,
        },
      },
    },
    orderBy: { branch_name: 'asc' }
  });

  const totalAccounts = await prisma.documentrequest.count({
    where: { documentType: "ACCOUNT" },
  });
  const totalLoans = await prisma.documentrequest.count({
    where: { documentType: "LOAN" },
  });
  const totalInvestments = await prisma.documentrequest.count({
    where: { documentType: "INVESTMENT" },
  });

  const totalSystemDocuments = totalAccounts + totalLoans + totalInvestments;

  // Plain objects for client
  const branchesPlain = branches.map(b => ({
    id: b.id,
    branch_name: b.branch_name,
    branch_code: b.branch_code,
    account: b._count.account,
    loan: b._count.loan,
    investment: b._count.investment,
    documentrequest: b._count.documentrequest,
    totalFiles: b._count.account + b._count.loan + b._count.investment,
  }));

  const stats = [
    { label: "Active Branches", value: branches.length, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Documents", value: totalSystemDocuments, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Accounts", value: totalAccounts, color: "text-purple-600", bg: "bg-purple-50", href: "/dashboard/documents/ACCOUNT" },
    { label: "Total Loans", value: totalLoans, color: "text-orange-600", bg: "bg-orange-50", href: "/dashboard/documents/LOAN" },
    { label: "Total Investments", value: totalInvestments, color: "text-cyan-600", bg: "bg-cyan-50", href: "/dashboard/documents/INVESTMENT" },
  ];

  
}