function readBookings() {
  try { return JSON.parse(localStorage.getItem('salabook:bookings')) || []; } catch { return []; }
}
function writeBookings(list) {
  localStorage.setItem('salabook:bookings', JSON.stringify(list));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem('salabook:session')); } catch { return null; }
}

const params = new URLSearchParams(location.search);
const bookingId = Number(params.get('booking_id'));
const all = readBookings();
const booking = all.find(b => b.id === bookingId);

const info = document.getElementById('bookingInfo');
const status = document.getElementById('bookingStatus');
const payForm = document.getElementById('payForm');
const doneBox = document.getElementById('doneBox');

if (!booking) {
  info.textContent = 'Booking not found.';
  payForm.style.display = 'none';
} else {
  info.textContent = `Booking #${booking.id} • Hall ${booking.hallId} • ${booking.startDate} → ${booking.endDate} • ${booking.days} day(s) • ${booking.total ? booking.total.toLocaleString('th-TH') + ' THB' : ''}`;
  const isConfirmed = booking.status === 'confirmed';
  const isPendingReview = booking.status === 'paid_pending_review';
  status.textContent = isConfirmed ? 'Confirmed' : (isPendingReview ? 'Payment Submitted - Awaiting Admin Confirmation' : 'Pending Payment');
  status.className = 'status ' + (isConfirmed ? 'success' : 'pending');
  if (isConfirmed || isPendingReview) {
    payForm.style.display = 'none';
    doneBox.style.display = '';
  }
}

document.getElementById('markPaidBtn')?.addEventListener('click', () => {
  const session = getSession();
  if (!session || !session.email || !booking || booking.userEmail !== session.email) {
    alert('You are not authorized for this booking.');
    return;
  }
  // Demo: store slip filename only; real app uploads to storage
  const fileInput = document.getElementById('slip');
  const slipName = fileInput?.files?.[0]?.name || null;
  booking.status = 'paid_pending_review';
  booking.paidAt = new Date().toISOString();
  booking.slipName = slipName;
  writeBookings(all);
  location.reload();
});


