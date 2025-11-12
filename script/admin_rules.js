// Keys are compatible with view_detail.js helpers
function storageKeyAvailability(hallId) {
  return `salabook:availability:${hallId}`;
}
function storageKeyPricing(hallId) {
  return `salabook:pricing:${hallId}`;
}

// Simple auth guard: only admin can access this page
(function guard() {
  try {
    const session = JSON.parse(localStorage.getItem('salabook:session'));
    if (!session || session.role !== 'admin') {
      alert('Admin access only.');
      window.location.href = 'salabook_landing.html';
    }
  } catch {
    window.location.href = 'salabook_landing.html';
  }
})();

// Bookings helpers for payment confirmation
function readBookings() {
  try { return JSON.parse(localStorage.getItem('salabook:bookings')) || []; } catch { return []; }
}
function writeBookings(list) {
  localStorage.setItem('salabook:bookings', JSON.stringify(list));
}

function getDateRange(startIso, endIso) {
  const dates = [];
  const start = new Date(startIso);
  const end = new Date(endIso);
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function getHallIdFromKey(key) {
  // "A" | "B" | "C" from select
  const map = { A: 1, B: 2, C: 3 };
  return map[key] || 1;
}

function seedAvailability(hallId) {
  const today = new Date();
  const map = {};
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const randomBlock = Math.random() < 0.12;
    map[iso] = !(isWeekend || randomBlock);
  }
  localStorage.setItem(storageKeyAvailability(hallId), JSON.stringify(map));
  return map;
}

function loadAvailability(hallId) {
  try {
    const raw = localStorage.getItem(storageKeyAvailability(hallId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAvailability(hallId, map) {
  localStorage.setItem(storageKeyAvailability(hallId), JSON.stringify(map));
}

function loadPricingRules(hallId) {
  try {
    const raw = localStorage.getItem(storageKeyPricing(hallId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePricingRules(hallId, rules) {
  localStorage.setItem(storageKeyPricing(hallId), JSON.stringify(rules));
}

function renderAvailabilityTable(map) {
  const table = document.getElementById('admin-availability');
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
  rules.forEach((r, idx) => {
    const tr = document.createElement('tr');
    const tdS = document.createElement('td'); tdS.textContent = r.start;
    const tdE = document.createElement('td'); tdE.textContent = r.end;
    const tdP = document.createElement('td'); tdP.textContent = Number(r.pricePerDay || 0).toLocaleString('th-TH');
    const tdA = document.createElement('td');
    const del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      rules.splice(idx, 1);
      renderRulesTable(rules);
      const hallKey = document.getElementById('hall-select').value;
      const hallId = getHallIdFromKey(hallKey);
      savePricingRules(hallId, rules);
    });
    tdA.appendChild(del);
    tr.appendChild(tdS); tr.appendChild(tdE); tr.appendChild(tdP); tr.appendChild(tdA);
    table.appendChild(tr);
  });
}

function loadAll() {
  const hallKey = document.getElementById('hall-select').value;
  const hallId = getHallIdFromKey(hallKey);
  let availability = loadAvailability(hallId);
  if (!availability) availability = seedAvailability(hallId);
  renderAvailabilityTable(availability);
  const rules = loadPricingRules(hallId);
  renderRulesTable(rules);
}

document.getElementById('reload-btn').addEventListener('click', loadAll);
document.getElementById('toggle-date-btn').addEventListener('click', () => {
  const hallKey = document.getElementById('hall-select').value;
  const hallId = getHallIdFromKey(hallKey);
  const date = document.getElementById('toggle-date').value;
  if (!date) return alert('Pick a date to toggle');
  const availability = loadAvailability(hallId) || {};
  availability[date] = !(availability[date] !== false);
  saveAvailability(hallId, availability);
  renderAvailabilityTable(availability);
});

document.getElementById('reset-availability-btn').addEventListener('click', () => {
  if (!confirm('Reset and regenerate availability for next 60 days?')) return;
  const hallKey = document.getElementById('hall-select').value;
  const hallId = getHallIdFromKey(hallKey);
  const availability = seedAvailability(hallId);
  renderAvailabilityTable(availability);
});

document.getElementById('add-rule-btn').addEventListener('click', () => {
  const hallKey = document.getElementById('hall-select').value;
  const hallId = getHallIdFromKey(hallKey);
  const start = document.getElementById('price-start').value;
  const end = document.getElementById('price-end').value;
  const price = Number(document.getElementById('price-per-day').value);
  if (!start || !end || !price || price <= 0) return alert('Fill start, end, and positive price');
  if (end < start) return alert('End must be after or equal to start');
  const rules = loadPricingRules(hallId);
  // Merge or append: if same range exists, update price
  const existing = rules.find(r => r.start === start && r.end === end);
  if (existing) existing.pricePerDay = price;
  else rules.push({ start, end, pricePerDay: price });
  savePricingRules(hallId, rules);
  renderRulesTable(rules);
});

document.getElementById('clear-rules-btn').addEventListener('click', () => {
  if (!confirm('Clear all pricing rules?')) return;
  const hallKey = document.getElementById('hall-select').value;
  const hallId = getHallIdFromKey(hallKey);
  savePricingRules(hallId, []);
  renderRulesTable([]);
});

// Initialize from URL ?hall=A
(function init() {
  const params = new URLSearchParams(location.search);
  const hallKey = params.get('hall');
  if (hallKey && ['A','B','C'].includes(hallKey)) {
    document.getElementById('hall-select').value = hallKey;
  }
  renderOverview();
  loadAll();
  renderPaymentsTable();
  renderCancellationsTable();
})();

// ===== Overview (Income and key counts) =====
function renderOverview() {
  const wrap = document.getElementById('overview-cards');
  if (!wrap) return;
  const list = readBookings();
  const now = new Date();
  const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  const confirmed = list.filter(b => b.status === 'confirmed');
  const confirmedThisMonth = confirmed.filter(b => (b.verifiedAt || b.createdAt || '').startsWith(thisMonth));
  const pendingPayments = list.filter(b => b.status === 'paid_pending_review').length;
  const cancelRequests = list.filter(b => b.status === 'cancel_requested').length;

  const sum = arr => arr.reduce((s, b) => s + (Number(b.total) || 0), 0);
  const totalIncome = sum(confirmed);
  const monthIncome = sum(confirmedThisMonth);

  wrap.innerHTML = `
    ${statCard('Total Confirmed Income', totalIncome.toLocaleString('th-TH') + ' THB')}
    ${statCard('Income (This Month)', monthIncome.toLocaleString('th-TH') + ' THB')}
    ${statCard('Pending Payments', String(pendingPayments))}
    ${statCard('Cancellation Requests', String(cancelRequests))}
  `;
}
function statCard(title, value) {
  return `<div class="stat-card"><div class="stat-title">${title}</div><div class="stat-value">${value}</div></div>`;
}

// ===== Payments Table (Admin review) =====
function renderPaymentsTable() {
  const table = document.getElementById('payments-table');
  if (!table) return;
  table.innerHTML = '';
  const header = document.createElement('tr');
  ['Booking ID', 'User', 'Hall', 'Dates', 'Days', 'Total', 'Slip', 'Status', 'Actions'].forEach(h => {
    const th = document.createElement('th'); th.textContent = h; header.appendChild(th);
  });
  table.appendChild(header);

  const bookings = readBookings().filter(b => b.status === 'paid_pending_review');
  if (!bookings.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.colSpan = 9; td.textContent = 'No payments awaiting confirmation.';
    tr.appendChild(td); table.appendChild(tr);
    return;
  }

  bookings.forEach(b => {
    const tr = document.createElement('tr');
    const tdId = document.createElement('td'); tdId.textContent = b.id;
    const tdUser = document.createElement('td'); tdUser.textContent = b.userEmail;
    const tdHall = document.createElement('td'); tdHall.textContent = b.hallId;
    const tdDates = document.createElement('td'); tdDates.textContent = `${b.startDate} → ${b.endDate}`;
    const tdDays = document.createElement('td'); tdDays.textContent = b.days;
    const tdTotal = document.createElement('td'); tdTotal.textContent = b.total ? Number(b.total).toLocaleString('th-TH') + ' THB' : '-';
    const tdSlip = document.createElement('td'); tdSlip.textContent = b.slipName || '-';
    const tdStatus = document.createElement('td'); tdStatus.textContent = b.status;
    const tdActions = document.createElement('td');
    const verifyBtn = document.createElement('button'); verifyBtn.className = 'btn'; verifyBtn.textContent = 'Verify';
    const rejectBtn = document.createElement('button'); rejectBtn.className = 'btn danger'; rejectBtn.textContent = 'Reject';

    verifyBtn.addEventListener('click', () => {
      const all = readBookings();
      const index = all.findIndex(x => x.id === b.id);
      if (index >= 0) {
        all[index].status = 'confirmed';
        all[index].verifiedAt = new Date().toISOString();
        // Mark the confirmed booking dates as unavailable in availability map
        const hallId = all[index].hallId;
        try {
          const avail = loadAvailability(hallId) || {};
          const days = getDateRange(all[index].startDate, all[index].endDate);
          days.forEach(d => { avail[d] = false; });
          saveAvailability(hallId, avail);
        } catch {}
        writeBookings(all);
        renderPaymentsTable();
      }
    });
    rejectBtn.addEventListener('click', () => {
      const reason = prompt('Reject payment? Optionally add a reason:');
      const all = readBookings();
      const index = all.findIndex(x => x.id === b.id);
      if (index >= 0) {
        all[index].status = 'payment_rejected';
        all[index].rejectedAt = new Date().toISOString();
        all[index].rejectReason = reason || '';
        writeBookings(all);
        renderPaymentsTable();
      }
    });

    tdActions.appendChild(verifyBtn); tdActions.appendChild(rejectBtn);

    tr.appendChild(tdId); tr.appendChild(tdUser); tr.appendChild(tdHall); tr.appendChild(tdDates);
    tr.appendChild(tdDays); tr.appendChild(tdTotal); tr.appendChild(tdSlip); tr.appendChild(tdStatus); tr.appendChild(tdActions);
    table.appendChild(tr);
  });
}

// ===== Cancellation Requests (Admin review) =====
function renderCancellationsTable() {
  const table = document.getElementById('cancellations-table');
  if (!table) return;
  table.innerHTML = '';
  const header = document.createElement('tr');
  ['Booking ID', 'User', 'Hall', 'Dates', 'Days', 'Total', 'Reason', 'Status', 'Actions'].forEach(h => {
    const th = document.createElement('th'); th.textContent = h; header.appendChild(th);
  });
  table.appendChild(header);

  const bookings = readBookings().filter(b => b.status === 'cancel_requested');
  if (!bookings.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.colSpan = 9; td.textContent = 'No cancellation requests.';
    tr.appendChild(td); table.appendChild(tr);
    return;
  }

  bookings.forEach(b => {
    const tr = document.createElement('tr');
    const tdId = document.createElement('td'); tdId.textContent = b.id;
    const tdUser = document.createElement('td'); tdUser.textContent = b.userEmail;
    const tdHall = document.createElement('td'); tdHall.textContent = b.hallId;
    const tdDates = document.createElement('td'); tdDates.textContent = `${b.startDate} → ${b.endDate}`;
    const tdDays = document.createElement('td'); tdDays.textContent = b.days;
    const tdTotal = document.createElement('td'); tdTotal.textContent = b.total ? Number(b.total).toLocaleString('th-TH') + ' THB' : '-';
    const tdReason = document.createElement('td'); tdReason.textContent = b.cancelReason || '-';
    const tdStatus = document.createElement('td'); tdStatus.textContent = b.status;
    const tdActions = document.createElement('td');
    const approveBtn = document.createElement('button'); approveBtn.className = 'btn'; approveBtn.textContent = 'Approve';
    const rejectBtn = document.createElement('button'); rejectBtn.className = 'btn danger'; rejectBtn.textContent = 'Reject';

    approveBtn.addEventListener('click', () => {
      const all = readBookings();
      const index = all.findIndex(x => x.id === b.id);
      if (index >= 0) {
        all[index].status = 'cancelled';
        all[index].cancelledAt = new Date().toISOString();
        writeBookings(all);
        renderCancellationsTable();
      }
    });
    rejectBtn.addEventListener('click', () => {
      const reason = prompt('Reason for rejecting cancellation?') || '';
      const all = readBookings();
      const index = all.findIndex(x => x.id === b.id);
      if (index >= 0) {
        all[index].status = 'cancel_rejected';
        all[index].cancelRejectReason = reason;
        writeBookings(all);
        renderCancellationsTable();
      }
    });

    tdActions.appendChild(approveBtn); tdActions.appendChild(rejectBtn);

    tr.appendChild(tdId); tr.appendChild(tdUser); tr.appendChild(tdHall); tr.appendChild(tdDates);
    tr.appendChild(tdDays); tr.appendChild(tdTotal); tr.appendChild(tdReason); tr.appendChild(tdStatus); tr.appendChild(tdActions);
    table.appendChild(tr);
  });
}


