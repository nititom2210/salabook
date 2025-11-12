// Simple client-side auth with role support (demo)
const STORAGE_USERS = 'salabook:users';
const STORAGE_SESSION = 'salabook:session';
const ADMIN_CODE = 'ADMIN123'; // demo-only; replace with server verification later

function readUsers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_USERS)) || []; } catch { return []; }
}
function writeUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_SESSION)); } catch { return null; }
}
function setSession(session) {
  localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
}
function clearSession() {
  localStorage.removeItem(STORAGE_SESSION);
}

// UI elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const dropdownMenu = document.getElementById('dropdownMenu');
const userAvatar = document.getElementById('userAvatar');
const accountSection = document.getElementById('accountSection');

// Modals
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const closeLogin = document.getElementById('closeLogin');
const closeSignup = document.getElementById('closeSignup');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');

// Forms
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const signupRole = document.getElementById('signupRole');
const adminCodeGroup = document.getElementById('adminCodeGroup');
const adminCodeInput = document.getElementById('adminCode');

// Account display fields
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profilePhone = document.getElementById('profilePhone');
const profileDate = document.getElementById('profileDate');

// Modal helpers
function openModal(modal) { if (modal) modal.style.display = 'block'; }
function closeModal(modal) { if (modal) modal.style.display = 'none'; }

// Toggle admin code field
if (signupRole) {
  signupRole.addEventListener('change', () => {
    adminCodeGroup.style.display = signupRole.value === 'admin' ? '' : 'none';
  });
}

// Open/close buttons
loginBtn?.addEventListener('click', () => openModal(loginModal));
signupBtn?.addEventListener('click', () => openModal(signupModal));
closeLogin?.addEventListener('click', () => closeModal(loginModal));
closeSignup?.addEventListener('click', () => closeModal(signupModal));
switchToSignup?.addEventListener('click', (e) => { e.preventDefault(); closeModal(loginModal); openModal(signupModal); });
switchToLogin?.addEventListener('click', (e) => { e.preventDefault(); closeModal(signupModal); openModal(loginModal); });

// Dropdown for user menu
userAvatar?.addEventListener('click', () => {
  if (!dropdownMenu) return;
  const isOpen = dropdownMenu.style.display === 'block';
  dropdownMenu.style.display = isOpen ? 'none' : 'block';
});
document.addEventListener('click', (e) => {
  if (!dropdownMenu) return;
  if (!userMenu?.contains(e.target)) dropdownMenu.style.display = 'none';
});

// Signup
signupForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const phone = document.getElementById('signupPhone').value.trim();
  const password = document.getElementById('signupPassword').value;
  const role = signupRole?.value || 'user';
  if (!name || !email || !phone || !password) {
    alert('Please fill all required fields.');
    return;
  }
  if (role === 'admin') {
    const code = adminCodeInput.value;
    if (code !== ADMIN_CODE) {
      alert('Invalid admin access code.');
      return;
    }
  }
  const users = readUsers();
  if (users.some(u => u.email === email)) {
    alert('An account with this email already exists.');
    return;
  }
  users.push({
    id: Date.now(),
    name, email, phone,
    password, // demo only
    role,
    createdAt: new Date().toISOString()
  });
  writeUsers(users);
  setSession({ email, role, name, phone, loginAt: new Date().toISOString() });
  closeModal(signupModal);
  alert('Account created. You are now logged in.');
  renderAuthUI();
});

// Login
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    alert('Invalid email or password.');
    return;
  }
  setSession({ email: user.email, role: user.role, name: user.name, phone: user.phone, loginAt: new Date().toISOString() });
  closeModal(loginModal);
  renderAuthUI();
});

// Menu actions
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  clearSession();
  renderAuthUI();
});
document.getElementById('viewProfile')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!accountSection) return;
  accountSection.scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('myBookings')?.addEventListener('click', (e) => {
  e.preventDefault();
  renderMyBookings();
});
document.getElementById('myBookingsLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  renderMyBookings();
});
document.getElementById('settings')?.addEventListener('click', (e) => {
  e.preventDefault();
  alert('Settings — demo placeholder.');
});

function renderAuthUI() {
  const session = getSession();
  if (session && session.email) {
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    // Badge/link for admin
    if (dropdownMenu) {
      if (session.role === 'admin' && !document.getElementById('adminLink')) {
        const a = document.createElement('a');
        a.href = 'admin_rules.html';
        a.id = 'adminLink';
        a.textContent = 'Admin Dashboard';
        dropdownMenu.insertBefore(a, dropdownMenu.firstChild);
      }
      if (!document.getElementById('myBookingsPageLink')) {
        const b = document.createElement('a');
        b.href = 'my_bookings.html';
        b.id = 'myBookingsPageLink';
        b.textContent = 'My Bookings (Page)';
        dropdownMenu.appendChild(b);
      }
    }
    // Fill account profile
    if (profileName) profileName.textContent = session.name || '-';
    if (profileEmail) profileEmail.textContent = session.email || '-';
    if (profilePhone) profilePhone.textContent = session.phone || '-';
    if (profileDate) {
      const users = readUsers();
      const u = users.find(x => x.email === session.email);
      profileDate.textContent = u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-';
    }
  } else {
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    const adminLink = document.getElementById('adminLink');
    if (adminLink) adminLink.remove();
  }
}

// Init
renderAuthUI();

// ===== My Bookings Rendering =====
function readBookings() {
  try { return JSON.parse(localStorage.getItem('salabook:bookings')) || []; } catch { return []; }
}
function renderMyBookings() {
  const session = getSession();
  if (!session || !session.email) {
    alert('Please login to view bookings.');
    return;
  }
  if (!accountSection) return;
  accountSection.scrollIntoView({ behavior: 'smooth' });
  // Show all user bookings across statuses
  const bookings = readBookings().filter(b => b.userEmail === session.email);
  const el = document.getElementById('accountContent');
  if (!el) return;
  if (bookings.length === 0) {
    el.innerHTML = `<h2>My Bookings</h2><p>You have no bookings.</p>`;
    return;
  }
  const rows = bookings.map(b => {
    let action = '-';
    if (b.status === 'pending_payment') {
      action = `<a href="payment.html?booking_id=${b.id}">Pay</a>`;
    } else if (b.status === 'paid_pending_review') {
      action = 'Awaiting admin confirmation';
    } else if (b.status === 'confirmed') {
      action = `<button class="btn danger btn-cancel" data-id="${b.id}">Request Cancel</button>`;
    } else if (b.status === 'cancel_requested') {
      action = 'Awaiting admin approval';
    } else if (b.status === 'cancelled' || b.status === 'cancel_rejected') {
      action = `<button class="btn btn-delete" data-id="${b.id}">Delete</button>`;
    }
    return `
      <tr>
        <td>${b.id}</td>
        <td>${b.hallId}</td>
        <td>${b.startDate} → ${b.endDate}</td>
        <td>${b.days}</td>
        <td>${b.total ? Number(b.total).toLocaleString('th-TH') + ' THB' : '-'}</td>
        <td>${b.status}</td>
        <td>${action}</td>
      </tr>
    `;
  }).join('');
  el.innerHTML = `
    <h2>My Bookings</h2>
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Hall</th>
          <th>Dates</th>
          <th>Days</th>
          <th>Total</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  // Bind cancel request buttons
  el.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      const reason = prompt('Please provide a reason for cancellation (optional):') || '';
      const list = readBookings();
      const idx = list.findIndex(x => x.id === id && x.userEmail === session.email);
      if (idx < 0) return;
      if (list[idx].status !== 'confirmed') {
        alert('Only confirmed bookings can be cancelled.');
        return;
      }
      list[idx].status = 'cancel_requested';
      list[idx].cancelReason = reason;
      list[idx].cancelRequestedAt = new Date().toISOString();
      localStorage.setItem('salabook:bookings', JSON.stringify(list));
      renderMyBookings();
    });
  });

  // Bind delete buttons (only for cancelled/cancel_rejected)
  el.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      if (!confirm('Delete this booking from your list? This cannot be undone.')) return;
      const list = readBookings();
      const idx = list.findIndex(x => x.id === id && x.userEmail === session.email);
      if (idx < 0) return;
      if (list[idx].status !== 'cancelled' && list[idx].status !== 'cancel_rejected') {
        alert('You can delete only cancelled bookings.');
        return;
      }
      list.splice(idx, 1);
      localStorage.setItem('salabook:bookings', JSON.stringify(list));
      renderMyBookings();
    });
  });
}


