/**
 * Payment with API Backend
 * Include this AFTER api.js
 */

const params = new URLSearchParams(location.search);
const bookingId = Number(params.get('booking_id'));

let booking = null;

// Load booking details
async function loadBooking() {
  const info = document.getElementById('bookingInfo');
  const status = document.getElementById('bookingStatus');
  const payForm = document.getElementById('payForm');
  const doneBox = document.getElementById('doneBox');

  try {
    const response = await api.getBooking(bookingId);
    booking = response.data;

    if (!booking) {
      info.textContent = 'Booking not found.';
      payForm.style.display = 'none';
      return;
    }

    info.textContent = `Booking #${booking.id} • Hall ${booking.hall_name || booking.hall_id} • ${booking.start_date} → ${booking.end_date} • ${booking.days} day(s) • ${booking.total ? Number(booking.total).toLocaleString('th-TH') + ' THB' : ''}`;
    
    const isConfirmed = booking.status === 'confirmed';
    const isPendingReview = booking.status === 'paid_pending_review';
    status.textContent = isConfirmed ? 'Confirmed' : (isPendingReview ? 'Payment Submitted - Awaiting Admin Confirmation' : 'Pending Payment');
    status.className = 'status ' + (isConfirmed ? 'success' : 'pending');
    
    if (isConfirmed || isPendingReview) {
      payForm.style.display = 'none';
      doneBox.style.display = '';
    }
  } catch (error) {
    const info = document.getElementById('bookingInfo');
    info.textContent = 'Error loading booking: ' + error.message;
    document.getElementById('payForm').style.display = 'none';
  }
}

// Submit payment
document.getElementById('markPaidBtn')?.addEventListener('click', async () => {
  try {
    const sessionResponse = await api.getSession();
    if (!sessionResponse || !sessionResponse.data || !sessionResponse.data.user) {
      alert('You are not authorized for this booking.');
      return;
    }

    if (!booking || booking.user_id !== sessionResponse.data.user.id) {
      alert('You are not authorized for this booking.');
      return;
    }

    const fileInput = document.getElementById('slip');
    const slipFile = fileInput?.files?.[0] || null;

    await api.submitPayment(bookingId, slipFile);
    alert('Payment submitted successfully!');
    location.reload();
  } catch (error) {
    alert('Error submitting payment: ' + error.message);
  }
});

// Load on page load
loadBooking();

