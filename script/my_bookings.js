function getSession() {
  try { return JSON.parse(localStorage.getItem('salabook:session')); } catch { return null; }
}
function readBookings() {
  try { return JSON.parse(localStorage.getItem('salabook:bookings')) || []; } catch { return []; }
}
function writeBookings(list) {
  localStorage.setItem('salabook:bookings', JSON.stringify(list));
}

const session = getSession();
const container = document.getElementById('bookingsList');
if (!session || !session.email) {
  container.innerHTML = '<div class="card">Please login to view your bookings.</div>';
} else {
  render();
}

function render() {
  const bookings = readBookings().filter(b => b.userEmail === session.email);
  if (!bookings.length) {
    container.innerHTML = '<div class="card">You have no bookings.</div>';
    return;
  }
  container.innerHTML = bookings.map(b => {
    const status = b.status;
    const summary = `
      <div><strong>Booking #${b.id}</strong> • Hall ${b.hallId}</div>
      <div>${b.startDate} → ${b.endDate} • ${b.days} day(s)</div>
      <div>Total: ${b.total ? Number(b.total).toLocaleString('th-TH') + ' THB' : '-'}</div>
      <div>Status: ${status}</div>
      ${b.cancelReason ? `<div>Cancel reason: ${b.cancelReason}</div>` : ''}
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
}

function bindActions() {
  container.querySelectorAll('[data-action="cancel"]').forEach(el => {
    el.addEventListener('click', () => {
      const id = Number(el.getAttribute('data-id'));
      const list = readBookings();
      const idx = list.findIndex(x => x.id === id && x.userEmail === session.email);
      if (idx < 0) return;
      if (list[idx].status !== 'confirmed') return alert('Only confirmed bookings can be cancelled.');
      const reason = prompt('Reason for cancellation (optional):') || '';
      list[idx].status = 'cancel_requested';
      list[idx].cancelReason = reason;
      list[idx].cancelRequestedAt = new Date().toISOString();
      writeBookings(list);
      render();
    });
  });
  container.querySelectorAll('[data-action="delete"]').forEach(el => {
    el.addEventListener('click', () => {
      const id = Number(el.getAttribute('data-id'));
      if (!confirm('Delete this booking from your view? This action cannot be undone.')) return;
      const list = readBookings();
      const idx = list.findIndex(x => x.id === id && x.userEmail === session.email);
      if (idx < 0) return;
      // Only allow delete for cancelled or cancel_rejected
      if (list[idx].status !== 'cancelled' && list[idx].status !== 'cancel_rejected') {
        alert('You can only delete bookings after cancellation is finalized.');
        return;
      }
      list.splice(idx, 1);
      writeBookings(list);
      render();
    });
  });
}


