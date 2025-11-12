/**
 * My Bookings with API Backend
 * Include this AFTER api.js
 */

const container = document.getElementById('bookingsList');

async function checkAuth() {
  try {
    const response = await api.getSession();
    if (!response || !response.data || !response.data.user) {
      container.innerHTML = '<div class="card">Please login to view your bookings.</div>';
      return null;
    }
    return response.data.user;
  } catch (error) {
    container.innerHTML = '<div class="card">Please login to view your bookings.</div>';
    return null;
  }
}

async function render() {
  const user = await checkAuth();
  if (!user) return;

  try {
    const response = await api.getMyBookings();
    const bookings = response.data || [];

    if (!bookings.length) {
      container.innerHTML = '<div class="card">You have no bookings.</div>';
      return;
    }

    container.innerHTML = bookings.map(b => {
      const status = b.status;
      const summary = `
        <div><strong>Booking #${b.id}</strong> • Hall ${b.hall_name || b.hall_id}</div>
        <div>${b.start_date} → ${b.end_date} • ${b.days} day(s)</div>
        <div>Total: ${b.total ? Number(b.total).toLocaleString('th-TH') + ' THB' : '-'}</div>
        <div>Status: ${status}</div>
        ${b.cancel_reason ? `<div>Cancel reason: ${b.cancel_reason}</div>` : ''}
      `;
      let actionHtml = '';
      if (status === 'pending_payment') {
        actionHtml = `<a href="payment.html?booking_id=${b.id}" class="btn">Pay</a>`;
      } else if (status === 'paid_pending_review') {
        actionHtml = `<span class="muted">Awaiting admin confirmation</span>`;
      } else if (status === 'confirmed') {
        actionHtml = `<button class="btn danger" data-action="cancel" data-id="${b.id}">Request Cancel</button>`;
      } else if (status === 'cancel_requested') {
        actionHtml = `<span class="muted">Cancellation pending admin approval</span>`;
      } else if (status === 'cancelled' || status === 'cancel_rejected') {
        actionHtml = `<button class="btn" data-action="delete" data-id="${b.id}">Delete From My Bookings</button>`;
      }
      return `<div class="card">
        ${summary}
        <div class="actions" style="margin-top:10px;">${actionHtml}</div>
      </div>`;
    }).join('');

    bindActions();
  } catch (error) {
    container.innerHTML = `<div class="card">Error loading bookings: ${error.message}</div>`;
  }
}

function bindActions() {
  container.querySelectorAll('[data-action="cancel"]').forEach(el => {
    el.addEventListener('click', async () => {
      const id = Number(el.getAttribute('data-id'));
      try {
        const reason = prompt('Reason for cancellation (optional):') || '';
        await api.cancelBooking(id, reason);
        await render();
      } catch (error) {
        alert(error.message || 'Failed to cancel booking.');
      }
    });
  });

  container.querySelectorAll('[data-action="delete"]').forEach(el => {
    el.addEventListener('click', async () => {
      const id = Number(el.getAttribute('data-id'));
      if (!confirm('Delete this booking from your view? This action cannot be undone.')) return;
      try {
        await api.deleteBooking(id);
        await render();
      } catch (error) {
        alert(error.message || 'Failed to delete booking.');
      }
    });
  });
}

// Initialize
render();

