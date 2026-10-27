
export function formatCurrency(amount?: number | null, currency: string = "INR"): string {
  const symbolMap: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "AED ",
  };

  const symbol = symbolMap[currency] || (currency ? `${currency} ` : "₹");
  const safeAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  
  if (currency === "INR") {
    // Format in Indian numbering system (e.g. 1,50,000.00)
    try {
      const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeAmount);
      return `₹${formatted}`;
    } catch {
      return `₹${safeAmount.toFixed(2)}`;
    }
  }

  return `${symbol}${safeAmount.toFixed(2)}`;
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formatted = d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${formatted} IST`;
  } catch {
    return dateStr;
  }
}

export function formatTimeShort(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

export function generateUpiUri(params: {
  upiId: string;
  name: string;
  amount: number;
  transactionRef?: string;
  note?: string;
}): string {
  const cleanName = encodeURIComponent(params.name || 'DhobiGhat');
  const cleanNote = encodeURIComponent(params.note || 'DhobiGhat Laundry');
  const tr = params.transactionRef ? `&tr=${encodeURIComponent(params.transactionRef)}` : '';
  return `upi://pay?pa=${params.upiId}&pn=${cleanName}&am=${params.amount.toFixed(2)}&cu=INR&tn=${cleanNote}${tr}`;
}

