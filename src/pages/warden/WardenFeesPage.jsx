import { useState, useEffect } from "react";
import PageShell from "../../components/common/PageShell";
import { getFeesApi, updateFeeStatusApi } from "../../services/hostelApi";

const WardenFeesPage = () => {
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

  const handleStatusChange = async (id, status) => {
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
      <PageShell
        title="Fees Access"
        subtitle="Review student fee records and update payment status."
      >
        <div className="text-center text-slate-400">Loading fees...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell
        title="Fees Access"
        subtitle="Review student fee records and update payment status."
      >
        <div className="text-center text-red-400">Error: {error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Fees Access"
      subtitle="Review student fee records and update payment status."
    >
      <div className="space-y-4">
        {fees && fees.length > 0 ? (
          fees.map((fee) => (
            <div key={fee.id} className="glass rounded-3xl p-5 shadow-2xl">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {fee.studentName}
                  </h3>
                  <div className="mt-3 space-y-1 text-sm text-slate-300">
                    <p>Student ID: {fee.studentId}</p>
                    <p>Amount: ₹{fee.amount}</p>
                    <p>Due Date: {fee.dueDate}</p>
                  </div>
                  <div className="mt-4">
                    <span className="badge">{fee.status}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => handleStatusChange(fee.id, "Pending")}
                  >
                    Mark Pending
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleStatusChange(fee.id, "Paid")}
                  >
                    Mark Paid
                  </button>
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

export default WardenFeesPage;