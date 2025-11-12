const params = new URLSearchParams(location.search);

const hallId = params.get("hall_id");
const start  = params.get("start");
const end    = params.get("end");
const total  = params.get("total");

// ✅ mock hall data (เหมือนทุกหน้า)
const halls = [
  { id: 1, name: "Sala A" },
  { id: 2, name: "Sala B" },
  { id: 3, name: "Sala C" }
];

document.getElementById("hall_id").value = hallId;

// ✅ แสดงชื่อ Hall
const hall = halls.find(h => h.id == hallId);
document.getElementById("hall_name").value = hall ? hall.name : "";

// ✅ เติมวันที่ถ้ามีส่งมาจาก view_detail
if (start) document.getElementById("start_date").value = start;
if (end)   document.getElementById("end_date").value   = end;

// Optionally show total in a simple inline summary if present
if (total) {
  const form = document.getElementById("booking-form");
  const p = document.createElement("p");
  p.style.fontWeight = "600";
  p.textContent = `Estimated total: ${Number(total).toLocaleString('th-TH')} THB`;
  form.insertBefore(p, form.querySelector("button[type='submit']"));
}

// Helpers to enforce availability before submitting
function storageKeyAvailability(hallId) {
  return `salabook:availability:${hallId}`;
}
function loadAvailability(hallId) {
  try {
    return JSON.parse(localStorage.getItem(storageKeyAvailability(hallId))) || {};
  } catch {
    return {};
  }
}
function getDateRange(startIso, endIso) {
  const out = [];
  const s = new Date(startIso);
  const e = new Date(endIso);
  const cur = new Date(s);
  while (cur <= e) {
    out.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

// Booking storage
function readBookings() {
  try { return JSON.parse(localStorage.getItem('salabook:bookings')) || []; } catch { return []; }
}
function writeBookings(bookings) {
  localStorage.setItem('salabook:bookings', JSON.stringify(bookings));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem('salabook:session')); } catch { return null; }
}

// ✅ ส่งจอง: block if any day is unavailable
document.getElementById("booking-form").addEventListener("submit", async e => {
  e.preventDefault();
  const hallIdNum = Number(document.getElementById("hall_id").value);
  const startDate = document.getElementById("start_date").value;
  const endDate = document.getElementById("end_date").value;
  const eventName = document.getElementById("funeral_name").value;
  const contactName = document.getElementById("contact_name")?.value;
  const contactPhone = document.getElementById("contact_phone")?.value;
  const contactEmail = document.getElementById("contact_email")?.value;
  const notes = document.getElementById("notes")?.value;

  const session = getSession();
  if (!session || !session.email) {
    alert("Please login before making a booking.");
    return;
  }
  if (!startDate || !endDate) {
    alert("Please select both start and end dates.");
    return;
  }
  if (endDate < startDate) {
    alert("End date must be after start date.");
    return;
  }
  if (!eventName || !contactName || !contactPhone) {
    alert("Please fill Event Name, Contact Name, and Phone.");
    return;
  }
  const availabilityMap = loadAvailability(hallIdNum);
  const dates = getDateRange(startDate, endDate);
  const hasUnavailable = dates.some(d => availabilityMap[d] === false);
  if (hasUnavailable) {
    alert("Your selected dates include unavailable days. Please change the range.");
    return;
  }

  const bookingId = Date.now();
  const booking = {
    id: bookingId,
    userEmail: session.email,
    hallId: hallIdNum,
    startDate,
    endDate,
    days: dates.length,
    eventName,
    contactName,
    contactPhone,
    contactEmail,
    notes,
    total: total ? Number(total) : undefined,
    status: 'pending_payment',
    createdAt: new Date().toISOString()
  };
  const all = readBookings();
  all.push(booking);
  writeBookings(all);

  // Redirect to payment page
  window.location.href = `payment.html?booking_id=${bookingId}`;
});
