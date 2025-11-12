/**
 * Authentication with API Backend
 * Include this AFTER api.js
 */

// Session cache
let currentSession = null;

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

// Get session from API
async function getSession() {
  if (currentSession) return currentSession;
  try {
    const response = await api.getSession();
    if (response && response.data && response.data.user) {
      currentSession = response.data.user;
      return currentSession;
    }
  } catch (error) {
    currentSession = null;
  }
  return null;
}

// Signup
signupForm?.addEventListener('submit', async (e) => {
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
  
  try {
    const userData = { name, email, phone, password, role };
    if (role === 'admin') {
      const code = adminCodeInput.value;
      if (!code) {
        alert('Admin access code required.');
        return;
      }
      userData.admin_code = code;
    }
    
    const response = await api.register(userData);
    currentSession = response.data.user;
    closeModal(signupModal);
    alert('Account created. You are now logged in.');
    await renderAuthUI();
  } catch (error) {
    alert(error.message || 'Registration failed.');
  }
});

// Login
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await api.login(email, password);
    currentSession = response.data.user;
    closeModal(loginModal);
    await renderAuthUI();
  } catch (error) {
    alert(error.message || 'Invalid email or password.');
  }
});

// Menu actions
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  try {
    await api.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
  currentSession = null;
  await renderAuthUI();
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

async function renderAuthUI() {
  const session = await getSession();
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
      profileDate.textContent = session.created_at ? new Date(session.created_at).toLocaleDateString() : '-';
    }
  } else {
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    const adminLink = document.getElementById('adminLink');
    if (adminLink) adminLink.remove();
  }
}

// ===== My Bookings Rendering =====
async function renderMyBookings() {
  const session = await getSession();
  if (!session || !session.email) {
    alert('Please login to view bookings.');
    return;
  }
  if (!accountSection) return;
  accountSection.scrollIntoView({ behavior: 'smooth' });
  
  const el = document.getElementById('accountContent');
  if (!el) return;
  
  try {
    const response = await api.getMyBookings();
    const bookings = response.data || [];
    
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
          <td>${b.hall_name || b.hall_id}</td>
          <td>${b.start_date} → ${b.end_date}</td>
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
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-id'));
        const reason = prompt('Please provide a reason for cancellation (optional):') || '';
        try {
          await api.cancelBooking(id, reason);
          await renderMyBookings();
        } catch (error) {
          alert(error.message || 'Failed to cancel booking.');
        }
      });
    });

    // Bind delete buttons
    el.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-id'));
        if (!confirm('Delete this booking from your list? This cannot be undone.')) return;
        try {
          await api.deleteBooking(id);
          await renderMyBookings();
        } catch (error) {
          alert(error.message || 'Failed to delete booking.');
        }
      });
    });
  } catch (error) {
    el.innerHTML = `<h2>My Bookings</h2><p>Error loading bookings: ${error.message}</p>`;
  }
}

// Init
renderAuthUI();

