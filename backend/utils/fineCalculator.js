/**
 * Reusable backend fine calculation function
 * Default fine rate: ₹10 per late day
 * Logic:
 * If Return Date <= Due Date: Late Days = 0, Fine = ₹0
 * If Return Date > Due Date: Late Days = Return Date - Due Date, Fine = Late Days * Fine Rate
 */
const calculateFine = (dueDate, returnDate = new Date(), customFineRate = null) => {
  const fineRate = customFineRate !== null ? Number(customFineRate) : Number(process.env.DEFAULT_FINE_RATE || 10);
  const due = new Date(dueDate);
  const ret = new Date(returnDate);

  // Normalize time to start of day for clean day comparison
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const retMidnight = new Date(ret.getFullYear(), ret.getMonth(), ret.getDate());

  const diffTime = retMidnight.getTime() - dueMidnight.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const lateDays = diffDays > 0 ? diffDays : 0;
  const totalFine = lateDays * fineRate;

  return {
    lateDays,
    fineRate,
    totalFine,
    isOverdue: lateDays > 0
  };
};

module.exports = {
  calculateFine
};
