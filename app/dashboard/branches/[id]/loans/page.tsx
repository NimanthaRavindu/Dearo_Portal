import {prisma} from "@/lib/db";
import {ArrowLeft, FileText, Plus, Eye } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import ViewDocButton from "@/components/ViewDocButton";

export default async function LoanPage({ params }: { params: Promise<{ id: string }> }) {
  
  const resolvedParams = await params;
  const branchId = parseInt(resolvedParams.id);

  if (isNaN(branchId)) {
    return <div>Invalid Branch ID in URL</div>;
  }
  
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: { loan: { orderBy: { id: 'desc' } } }
  });

  // Data Insertion Logic (Server Action)
  async function addLoan(formData: FormData) {
    "use server";
    const amount = formData.get("amount") as string;
    const contract = formData.get("contract") as string;
    const duration = formData.get("duration") as string;
    const type = formData.get("type") as string;
    const customerName = formData.get("customerName") as string;
    const loanDate = formData.get("loanDate") as string;

    await prisma.loan.create({
      data: {
        amount: parseFloat(amount),
        contract_no: contract,
        duration: duration,
        loan_type: type,
        customer_name: customerName,
        loan_date: loanDate ? new Date(loanDate) : new Date(),
        branchId: branchId,
      }
    });
    revalidatePath(`/dashboard/branches/${branchId}/loans`);
  }

  return (
    <div className="p-6 space-y-6">
      <Link href={`/dashboard/branches/${branchId}`} className="flex items-center gap-2 text-blue-600 font-bold hover:underline mb-4">
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold">{branch?.branch_name} - Loan Documents</h1>

      {/* Add Loan Form - UPDATED */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Add Loan Document</h2>
        <form action={addLoan} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="customerName" placeholder="Customer Name" className="border p-2.5 rounded-lg" required />
            <input name="contract" placeholder="Contract Number" className="border p-2.5 rounded-lg" required />
            <input name="amount" type="number" placeholder="Amount" className="border p-2.5 rounded-lg" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="loanDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="border p-2.5 rounded-lg" required />
            <input name="duration" placeholder="Duration (e.g. 12 Months)" className="border p-2.5 rounded-lg" required />
            <select name="type" className="border p-2.5 rounded-lg text-sm bg-white" required>
              <option value="">Select Loan Type</option>
              <option value="PD">PD</option>
              <option value="Micro">Micro</option>
              <option value="Daily">Daily</option>
              <option value="Business">Business</option>
              <option value="Share Purchase">Share Purchase</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-green-600 text-white p-2.5 rounded-lg font-bold hover:bg-green-700">Submit Document</button>
        </form>
      </div>

      {/* Loans List - UPDATED */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">Customer Name</th>
              <th className="p-4">Date</th>
              <th className="p-4">Contract No</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Type</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {branch?.loan.map((loan: any) => (
              <tr key={loan.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-medium">{loan.customer_name || '-'}</td>
                <td className="p-4">{loan.loan_date ? new Date(loan.loan_date).toLocaleDateString() : '-'}</td>
                <td className="p-4">{loan.contract_no}</td>
                <td className="p-4">Rs. {loan.amount.toLocaleString()}</td>
                <td className="p-4">{loan.loan_type}</td>
                <td className="p-4">
                  <ViewDocButton branchId={branchId} type="Loan" refNo={loan.contract_no} link={`/dashboard/branches/${branchId}/loans/${loan.id}`}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}