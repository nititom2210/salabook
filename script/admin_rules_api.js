/**
 * Admin Rules with API Backend
 * Include this AFTER api.js
 */

// Auth guard: only admin can access
(async function guard() {
  try {
    const response = await api.getSession();
    if (!response || !response.data || !response.data.user || response.data.user.role !== 'admin') {
      alert('Admin access only.');
      window.location.href = 'salabook_landing.html';
      return;
    }
  } catch {
    window.location.href = 'salabook_landing.html';
    return;
  }
  init();
})();

function getHallIdFromKey(key) {
  const map = { A: 1, B: 2, C: 3 };
  return map[key] || 1;
}

let currentHallId = 1;
let availabilityMap = {};
let pricingRules = [];

async function init() {
  // Initialize from URL ?hall=A
  const params = new URLSearchParams(location.search);
  const hallKey = params.get('hall');
  if (hallKey && ['A','B','C'].includes(hallKey)) {
    const select = document.getElementById('hall-select');
    if (select) select.value = hallKey;
  }
  
  await renderOverview();
  await loadAll();
  await renderPaymentsTable();
  await renderCancellationsTable();
}

async function loadAll() {
  const hallKey = document.getElementById('hall-select')?.value || 'A';
  currentHallId = getHallIdFromKey(hallKey);
  
  try {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 60);
    
    const availResponse = await api.getAdminAvailability(
      currentHallId,
      today.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    availabilityMap = availResponse.data || {};
    renderAvailabilityTable(availabilityMap);
    
    const rulesResponse = await api.getPricingRulesAdmin(currentHallId);
    pricingRules = rulesResponse.data || [];
    renderRulesTable(pricingRules);
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Error loading data: ' + error.message);
  }
}

document.getElementById('reload-btn')?.addEventListener('click', loadAll);

// Handle hall selection change
document.getElementById('hall-select')?.addEventListener('change', loadAll);

document.getElementById('toggle-date-btn')?.addEventListener('click', async () => {
  const date = document.getElementById('toggle-date')?.value;
  if (!date) {
    alert('Pick a date to toggle');
    return;
  }
  
  try {
    const isCurrentlyAvailable = availabilityMap[date] !== false;
    await api.setAvailability(currentHallId, date, !isCurrentlyAvailable);
    await loadAll();
  } catch (error) {
    alert('Error updating availability: ' + error.message);
  }
});

document.getElementById('reset-availability-btn')?.addEventListener('click', async () => {
  if (!confirm('Reset and regenerate availability for next 60 days?')) return;
  
  try {
    await api.seedAvailability(currentHallId, 60);
    await loadAll();
  } catch (error) {
    alert('Error seeding availability: ' + error.message);
  }
});

document.getElementById('add-rule-btn')?.addEventListener('click', async () => {
  const start = document.getElementById('price-start')?.value;
  const end = document.getElementById('price-end')?.value;
  const price = Number(document.getElementById('price-per-day')?.value);
  
  if (!start || !end || !price || price <= 0) {
    alert('Fill start, end, and positive price');
    return;
  }
  if (end < start) {
    alert('End must be after or equal to start');
    return;
  }
  
  try {
    await api.addPricingRule(currentHallId, start, end, price);
    await loadAll();
  } catch (error) {
    alert('Error adding rule: ' + error.message);
  }
});

document.getElementById('clear-rules-btn')?.addEventListener('click', async () => {
  if (!confirm('Clear all pricing rules?')) return;
  
  try {
    await api.clearPricingRules(currentHallId);
    await loadAll();
  } catch (error) {
    alert('Error clearing rules: ' + error.message);
  }
});

function renderAvailabilityTable(map) {
  const table = document.getElementById('admin-availability');
  if (!table) return;
  
  table.innerHTML = '';
  const header = document.createElement('tr');
  ['Date', 'Status'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    header.appendChild(th);
  });
  table.appendChild(header);
  
  const dates = Object.keys(map).sort();
  dates.forEach(iso => {
    const tr = document.createElement('tr');
    const tdD = document.createElement('td'); tdD.textContent = iso;
    const tdS = document.createElement('td');
    const available = map[iso] !== false;
    tdS.textContent = available ? 'Available' : 'Unavailable';
    tdS.className = available ? 'available' : 'unavailable';
    tdD.className = available ? 'available' : 'unavailable';
    tr.appendChild(tdD); tr.appendChild(tdS);
    table.appendChild(tr);
  });
}

function renderRulesTable(rules) {
  const table = document.getElementById('rules-table');
  if (!table) return;
  
  table.innerHTML = '';
  const header = document.createElement('tr');
  ['Start', 'End', 'Price/day (THB)', 'Actions'].forEach(h => {
    const th = document.createElement('th'); th.textContent = h; header.appendChild(th);
  });
  table.appendChild(header);
  
  if (!rules.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No rules — default price applies.';
    tr.appendChild(td);
    table.appendChild(tr);
    return;
  }
  
  rules.forEach((r) => {
    const tr = document.createElement('tr');
    const tdS = document.createElement('td'); tdS.textContent = r.start_date;
    const tdE = document.createElement('td'); tdE.textContent = r.end_date;
    const tdP = document.createElement('td'); tdP.textContent = Number(r.price_per_day).toLocaleString('th-TH');
    const tdA = document.createElement('td');
    const del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      try {
        await api.deletePricingRule(r.id);
        await loadAll();
      } catch (error) {
        alert('Error deleting rule: ' + error.message);
      }
    });
    tdA.appendChild(del);
    tr.appendChild(tdS); tr.appendChild(tdE); tr.appendChild(tdP); tr.appendChild(tdA);
    table.appendChild(tr);
  });
}

// Overview
async function renderOverview() {
  const wrap = document.getElementById('overview-cards');
  if (!wrap) return;
  
  try {
    const response = await api.getAdminOverview();
    const data = response.data;
    
    wrap.innerHTML = `
      ${statCard('Total Confirmed Income', Number(data.total_income || 0).toLocaleString('th-TH') + ' THB')}
      ${statCard('Income (This Month)', Number(data.month_income || 0).toLocaleString('th-TH') + ' THB')}
      ${statCard('Pending Payments', String(data.pending_payments || 0))}
      ${statCard('Cancellation Requests', String(data.cancel_requests || 0))}
    `;
  } catch (error) {
    console.error('Error loading overview:', error);
    wrap.innerHTML = '<div>Error loading overview</div>';
  }
}

function statCard(title, value) {
  return `<div class="stat-card"><div class="stat-title">${title}</div><div class="stat-value">${value}</div></div>`;
}

// Payments Table
async function renderPaymentsTable() {
  const table = document.getElementById('payments-table');
  if (!table) return;
  
  table.innerHTML = '';
  const header = document.createElement('tr');
  ['Booking ID', 'User', 'Hall', 'Dates', 'Days', 'Total', 'Slip', 'Status', 'Actions'].forEach(h => {
    const th = document.createElement('th'); th.textContent = h; header.appendChild(th);
  });
  table.appendChild(header);

  try {
    const response = await api.getAdminBookings('paid_pending_review');
    const bookings = response.data || [];

    if (!bookings.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.colSpan = 9; td.textContent = 'No payments awaiting confirmation.';
      tr.appendChild(td); table.appendChild(tr);
      return;
    }

    bookings.forEach(b => {
      const tr = document.createElement('tr');
      const tdId = document.createElement('td'); tdId.textContent = b.id;
      const tdUser = document.createElement('td'); tdUser.textContent = b.user_email || b.user_id;
      const tdHall = document.createElement('td'); tdHall.textContent = b.hall_name || b.hall_id;
      const tdDates = document.createElement('td'); tdDates.textContent = `${b.start_date} → ${b.end_date}`;
      const tdDays = document.createElement('td'); tdDays.textContent = b.days;
      const tdTotal = document.createElement('td'); tdTotal.textContent = b.total ? Number(b.total).toLocaleString('th-TH') + ' THB' : '-';
      const tdSlip = document.createElement('td'); tdSlip.textContent = b.slip_name || '-';
      const tdStatus = document.createElement('td'); tdStatus.textContent = b.status;
      const tdActions = document.createElement('td');
      const verifyBtn = document.createElement('button'); verifyBtn.className = 'btn'; verifyBtn.textContent = 'Verify';
      const rejectBtn = document.createElement('button'); rejectBtn.className = 'btn danger'; rejectBtn.textContent = 'Reject';

      verifyBtn.addEventListener('click', async () => {
        try {
          await api.verifyPayment(b.id, 'verify');
          await renderPaymentsTable();
          await renderOverview();
        } catch (error) {
          alert('Error verifying payment: ' + error.message);
        }
      });
      
      rejectBtn.addEventListener('click', async () => {
        const reason = prompt('Reject payment? Optionally add a reason:');
        try {
          await api.verifyPayment(b.id, 'reject', reason);
          await renderPaymentsTable();
        } catch (error) {
          alert('Error rejecting payment: ' + error.message);
        }
      });

      tdActions.appendChild(verifyBtn); tdActions.appendChild(rejectBtn);

      tr.appendChild(tdId); tr.appendChild(tdUser); tr.appendChild(tdHall); tr.appendChild(tdDates);
      tr.appendChild(tdDays); tr.appendChild(tdTotal); tr.appendChild(tdSlip); tr.appendChild(tdStatus); tr.appendChild(tdActions);
      table.appendChild(tr);
    });
  } catch (error) {
    console.error('Error loading payments:', error);
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.colSpan = 9; td.textContent = 'Error loading payments.';
    tr.appendChild(td); table.appendChild(tr);
  }
}

// Cancellations Table
async function renderCancellationsTable() {
  const table = document.getElementById('cancellations-table');
  if (!table) return;
  
  table.innerHTML = '';
  const header = document.createElement('tr');
  ['Booking ID', 'User', 'Hall', 'Dates', 'Days', 'Total', 'Reason', 'Status', 'Actions'].forEach(h => {
    const th = document.createElement('th'); th.textContent = h; header.appendChild(th);
  });
  table.appendChild(header);

  try {
    const response = await api.getAdminBookings('cancel_requested');
    const bookings = response.data || [];

    if (!bookings.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.colSpan = 9; td.textContent = 'No cancellation requests.';
      tr.appendChild(td); table.appendChild(tr);
      return;
    }

    bookings.forEach(b => {
      const tr = document.createElement('tr');
      const tdId = document.createElement('td'); tdId.textContent = b.id;
      const tdUser = document.createElement('td'); tdUser.textContent = b.user_email || b.user_id;
      const tdHall = document.createElement('td'); tdHall.textContent = b.hall_name || b.hall_id;
      const tdDates = document.createElement('td'); tdDates.textContent = `${b.start_date} → ${b.end_date}`;
      const tdDays = document.createElement('td'); tdDays.textContent = b.days;
      const tdTotal = document.createElement('td'); tdTotal.textContent = b.total ? Number(b.total).toLocaleString('th-TH') + ' THB' : '-';
      const tdReason = document.createElement('td'); tdReason.textContent = b.cancel_reason || '-';
      const tdStatus = document.createElement('td'); tdStatus.textContent = b.status;
      const tdActions = document.createElement('td');
      const approveBtn = document.createElement('button'); approveBtn.className = 'btn'; approveBtn.textContent = 'Approve';
      const rejectBtn = document.createElement('button'); rejectBtn.className = 'btn danger'; rejectBtn.textContent = 'Reject';

      approveBtn.addEventListener('click', async () => {
        try {
          await api.manageCancellation(b.id, 'approve');
          await renderCancellationsTable();
          await renderOverview();
        } catch (error) {
          alert('Error approving cancellation: ' + error.message);
        }
      });
      
      rejectBtn.addEventListener('click', async () => {
        const reason = prompt('Reason for rejecting cancellation?') || '';
        try {
          await api.manageCancellation(b.id, 'reject', reason);
          await renderCancellationsTable();
        } catch (error) {
          alert('Error rejecting cancellation: ' + error.message);
        }
      });

      tdActions.appendChild(approveBtn); tdActions.appendChild(rejectBtn);

      tr.appendChild(tdId); tr.appendChild(tdUser); tr.appendChild(tdHall); tr.appendChild(tdDates);
      tr.appendChild(tdDays); tr.appendChild(tdTotal); tr.appendChild(tdReason); tr.appendChild(tdStatus); tr.appendChild(tdActions);
      table.appendChild(tr);
    });
  } catch (error) {
    console.error('Error loading cancellations:', error);
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.colSpan = 9; td.textContent = 'Error loading cancellations.';
    tr.appendChild(td); table.appendChild(tr);
  }
}

