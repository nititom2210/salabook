/**
 * View Detail with API Backend
 * Include this AFTER api.js
 */

// Get hall parameter from URL
const params = new URLSearchParams(window.location.search);
const hallParam = params.get('hall');

let hall = null;
let availabilityMap = {};
let pricingRules = [];

// Load hall details from API
async function loadHall() {
  if (!hallParam) {
    document.getElementById('hall-name').textContent = 'Hall not found';
    document.getElementById('hall-description').textContent = 'Please select a valid hall from the halls page.';
    return;
  }

  try {
    // Try to get hall by name (A, B, C)
    const response = await api.getHallByName(hallParam);
    if (response && response.data) {
      hall = response.data;
      updateHallDisplay();
      loadAvailability();
      loadPricingRules();
      setupEventListeners();
    } else {
      throw new Error('Hall not found');
    }
  } catch (error) {
    document.getElementById('hall-name').textContent = 'Hall not found';
    document.getElementById('hall-description').textContent = 'Error loading hall details.';
    console.error('Error loading hall:', error);
  }
}

function updateHallDisplay() {
  if (!hall) return;

  document.getElementById('hall-image').src = hall.image || '';
  document.getElementById('hall-image').alt = hall.name;
  document.getElementById('hall-name').textContent = hall.name;
  document.getElementById('hall-location').textContent = hall.location || '';
  document.getElementById('hall-description').textContent = hall.description || '';
  document.getElementById('hall-capacity').textContent = `${hall.capacity} people`;
  document.getElementById('hall-cost').textContent = `${Number(hall.cost_per_day).toLocaleString('th-TH')} THB / day`;
  document.getElementById('hall-address').textContent = hall.address || '';

  // Fill sections
  if (document.getElementById('section-overview')) {
    document.getElementById('section-overview').textContent = hall.overview || '';
  }
  if (document.getElementById('section-suitable')) {
    document.getElementById('section-suitable').textContent = hall.suitable_for || '';
  }
  if (document.getElementById('section-facilities')) {
    document.getElementById('section-facilities').textContent = hall.facilities || '';
  }
  if (document.getElementById('section-terms')) {
    document.getElementById('section-terms').textContent = hall.terms || '';
  }

  // Amenities list
  const amenitiesList = document.getElementById('amenities-list');
  if (amenitiesList) {
    amenitiesList.innerHTML = '';
    const amenities = Array.isArray(hall.amenities) ? hall.amenities : 
                      (typeof hall.amenities === 'string' ? JSON.parse(hall.amenities || '[]') : []);
    amenities.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      amenitiesList.appendChild(li);
    });
  }

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  if (startDateInput) startDateInput.setAttribute('min', today);
  if (endDateInput) endDateInput.setAttribute('min', today);
}

async function loadAvailability() {
  if (!hall) return;

  try {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    
    const response = await api.getAvailability(
      hall.id,
      today.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    availabilityMap = response.data || {};
    renderAvailabilityTable();
  } catch (error) {
    console.error('Error loading availability:', error);
    availabilityMap = {};
  }
}

async function loadPricingRules() {
  if (!hall) return;

  try {
    const response = await api.getPricingRules(hall.id);
    pricingRules = response.data || [];
    renderPricingTable();
  } catch (error) {
    console.error('Error loading pricing rules:', error);
    pricingRules = [];
  }
}

function renderAvailabilityTable() {
  const availabilityTable = document.getElementById('availability-table');
  if (!availabilityTable) return;
  
  availabilityTable.innerHTML = '';
  const header = document.createElement('tr');
  const th1 = document.createElement('th'); th1.textContent = 'Date';
  const th2 = document.createElement('th'); th2.textContent = 'Status';
  header.appendChild(th1); header.appendChild(th2);
  availabilityTable.appendChild(header);

  const dates = Object.keys(availabilityMap).sort();
  dates.forEach(iso => {
    const tr = document.createElement('tr');
    const tdDate = document.createElement('td'); tdDate.textContent = iso;
    const tdStatus = document.createElement('td');
    const available = availabilityMap[iso] !== false;
    tdStatus.textContent = available ? 'Available' : 'Unavailable';
    tdStatus.className = available ? 'available' : 'unavailable';
    tdDate.className = available ? 'available' : 'unavailable';
    tr.appendChild(tdDate); tr.appendChild(tdStatus);
    availabilityTable.appendChild(tr);
  });
}

function renderPricingTable() {
  const table = document.getElementById('pricing-table');
  if (!table) return;
  
  table.innerHTML = '';
  const header = document.createElement('tr');
  ['Start', 'End', 'Price per day (THB)'].forEach(h => {
    const th = document.createElement('th'); th.textContent = h; header.appendChild(th);
  });
  table.appendChild(header);

  if (pricingRules.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent = `Default: ${Number(hall.cost_per_day).toLocaleString('th-TH')} THB / day`;
    tr.appendChild(td);
    table.appendChild(tr);
  } else {
    pricingRules.forEach(r => {
      const tr = document.createElement('tr');
      const tdS = document.createElement('td'); tdS.textContent = r.start_date;
      const tdE = document.createElement('td'); tdE.textContent = r.end_date;
      const tdP = document.createElement('td'); tdP.textContent = Number(r.price_per_day).toLocaleString('th-TH');
      tr.appendChild(tdS); tr.appendChild(tdE); tr.appendChild(tdP);
      table.appendChild(tr);
    });
    // Mention default after rules
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent = `Default (outside rules): ${Number(hall.cost_per_day).toLocaleString('th-TH')} THB / day`;
    tr.appendChild(td);
    table.appendChild(tr);
  }
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

function getPriceForDate(isoDate, rules, defaultPrice) {
  const d = new Date(isoDate);
  for (const r of rules) {
    const s = new Date(r.start_date);
    const e = new Date(r.end_date);
    if (d >= s && d <= e) return Number(r.price_per_day);
  }
  return Number(defaultPrice);
}

function setupEventListeners() {
  // Handle date validation
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  
  if (startDateInput) {
    startDateInput.addEventListener('change', function() {
      const startDate = this.value;
      if (endDateInput) {
        endDateInput.setAttribute('min', startDate);
        const endDate = endDateInput.value;
        if (endDate && endDate < startDate) {
          endDateInput.value = '';
        }
      }
      updatePricingSummary();
    });
  }

  if (endDateInput) {
    endDateInput.addEventListener('change', updatePricingSummary);
  }

  // Book Now button
  const bookBtn = document.getElementById('book-now-btn');
  if (bookBtn) {
    bookBtn.addEventListener('click', async function() {
      const startDate = startDateInput?.value;
      const endDate = endDateInput?.value;

      if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
      }

      if (endDate < startDate) {
        alert('End date must be after start date');
        return;
      }

      // Validate availability
      const rangeDates = getDateRange(startDate, endDate);
      const unavailableInRange = rangeDates.some(d => availabilityMap[d] === false);
      if (unavailableInRange) {
        alert('Selected range includes unavailable dates. Please choose different dates.');
        return;
      }

      // Compute total price
      try {
        const response = await api.calculatePrice(hall.id, startDate, endDate);
        const total = response.data.total;

        // Redirect to booking page
        window.location.href = `booking.html?hall_id=${hall.id}&start=${startDate}&end=${endDate}&total=${total}`;
      } catch (error) {
        alert('Error calculating price: ' + error.message);
      }
    });
  }

  // Update pricing summary on date change
  updatePricingSummary();
}

function updatePricingSummary() {
  const pricingSummaryEl = document.getElementById('pricing-summary');
  const dateHintEl = document.getElementById('date-hint');
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');

  if (!pricingSummaryEl || !startDateInput || !endDateInput) return;

  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  // Mark inputs red if selected date is unavailable
  const startUnavailable = startDate && availabilityMap[startDate] === false;
  const endUnavailable = endDate && availabilityMap[endDate] === false;
  startDateInput.classList.toggle('date-unavailable', !!startUnavailable);
  endDateInput.classList.toggle('date-unavailable', !!endUnavailable);

  // Show hint if any selected date is unavailable
  if (dateHintEl) {
    if (startUnavailable || endUnavailable) {
      dateHintEl.style.display = '';
      dateHintEl.textContent = 'One or more selected dates are unavailable. Please choose different dates.';
    } else {
      dateHintEl.style.display = 'none';
      dateHintEl.textContent = '';
    }
  }

  if (!startDate || !endDate || endDate < startDate) {
    pricingSummaryEl.textContent = '';
    return;
  }

  const dates = getDateRange(startDate, endDate);
  const hasUnavailable = dates.some(d => availabilityMap[d] === false);
  
  // Calculate price
  const total = dates.reduce((sum, d) => {
    return sum + getPriceForDate(d, pricingRules, hall.cost_per_day);
  }, 0);
  
  pricingSummaryEl.textContent = `${dates.length} day(s) • Total: ${total.toLocaleString('th-TH')} THB` + 
    (hasUnavailable ? ' • Includes unavailable dates' : '');
}

// Map embed
function setupMap() {
  const mapFrame = document.getElementById('map-frame');
  if (mapFrame && hall) {
    let url;
    if (hall.latitude && hall.longitude) {
      url = `https://www.google.com/maps?q=${hall.latitude},${hall.longitude}&hl=en&z=15&output=embed`;
    } else if (hall.address) {
      url = `https://www.google.com/maps?q=${encodeURIComponent(hall.address)}&hl=en&z=15&output=embed`;
    } else {
      url = `https://www.google.com/maps?q=${encodeURIComponent(hall.name)}&hl=en&z=15&output=embed`;
    }
    mapFrame.src = url;
  }
}

// Initialize
loadHall().then(() => {
  setupMap();
});

