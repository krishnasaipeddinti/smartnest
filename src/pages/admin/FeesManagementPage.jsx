import { useState, useEffect } from "react";
import PageShell from "../../components/common/PageShell";
import { getFeesApi, updateFeeStatusApi } from "../../services/hostelApi";

const FeesManagementPage = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);
        const data = await getFeesApi();
        setFees(data || []);
      } catch (err) {
        setError(err.message || "Failed to fetch fees");
        console.error("Error fetching fees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, []);

  const handleStatus = async (id, status) => {
    try {
      const updatedFee = await updateFeeStatusApi(id, { status });
      setFees(
        fees.map((fee) => (fee.id === id ? updatedFee : fee))
      );
    } catch (err) {
      console.error("Error updating fee status:", err);
      alert("Failed to update fee status");
    }
  };

  if (loading) {
    return (
      <PageShell title="Fees Management" subtitle="Review and update fee payment status.">
        <div className="text-center text-slate-400">Loading fees...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Fees Management" subtitle="Review and update fee payment status.">
        <div className="text-center text-red-400">Error: {error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Fees Management" subtitle="Review and update fee payment status.">
      <div className="space-y-4">
        {fees && fees.length > 0 ? (
          fees.map((fee) => (
            <div key={fee.id} className="glass rounded-3xl p-5 shadow-2xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{fee.studentName}</h3>
                  <p className="mt-2 text-slate-400">Amount: ₹{fee.amount}</p>
                  <p className="text-slate-400">Due Date: {fee.dueDate}</p>
                  <span className="badge mt-3">{fee.status}</span>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => handleStatus(fee.id, "Pending")}>Pending</button>
                  <button className="btn-secondary" onClick={() => handleStatus(fee.id, "Paid")}>Paid</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass rounded-3xl p-8 text-center text-slate-400 shadow-2xl">
            No fee records available.
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default FeesManagementPage;