// Hall data (extended)
const hallsData = {
  A: {
    id: 1,
    name: "Sala A",
    location: "📍 Near main gate",
    address: "123 Main Gate Rd, Bangkok",
    coords: { lat: 13.7563, lng: 100.5018 },
    capacity: 100,
    costPerDay: 3500,
    description: "Spacious hall suitable for 100 guests. This hall features ample space for ceremonies, gatherings, and memorial services. With easy access from the main entrance, it offers convenience for guests and families.",
    overview: "A spacious, well-lit hall ideal for medium to large ceremonies and community events.",
    suitableFor: " memorials, workshops, seminars, and community gatherings.",
    facilities: "Tables, chairs, sound system, projector screen, basic stage, restrooms nearby.",
    terms: "No smoking inside. Quiet hours after 9 PM. Cleaning fee may apply. Deposit required.",
    amenities: ["WiFi", "Air Conditioning", "Parking", "Projector", "Sound System"],
    image: "hall-1.jpg"
  },
  B: {
    id: 2,
    name: "Sala B",
    location: "📍 Behind the temple garden",
    address: "45 Garden Lane, Bangkok",
    coords: { lat: 13.7454, lng: 100.5340 },
    capacity: 60,
    costPerDay: 2500,
    description: "Quiet environment, perfect for small ceremonies. Located in a peaceful area surrounded by greenery, this intimate hall provides a serene atmosphere for respectful gatherings and memorial services.",
    overview: "An intimate hall located near the garden, best for small groups seeking privacy.",
    suitableFor: "Small memorials, workshops, meditation sessions, and family ceremonies.",
    facilities: "Chairs, portable speakers, whiteboard, fans, nearby restrooms.",
    terms: "No loud music. Decorations must be removable without damage.",
    amenities: ["WiFi", "Parking"],
    image: "hall-2.jpg"
  },
  C: {
    id: 3,
    name: "Sala C",
    location: "📍 Next to parking area",
    address: "8 Parking Avenue, Bangkok",
    coords: { lat: 13.7367, lng: 100.5232 },
    capacity: 120,
    costPerDay: 4200,
    description: "Air-conditioned hall with modern facilities. This contemporary hall offers comfort with climate control and updated amenities, ensuring a pleasant experience for all attendees regardless of weather conditions.",
    overview: "Modern hall with AC and contemporary fixtures for comfortable events year-round.",
    suitableFor: " community ceremonies.",
    facilities: "Air conditioning, projector, microphone, stage lighting, accessible entrance.",
    terms: "Return equipment in original condition. Overrun fee after 10 PM.",
    amenities: ["WiFi", "Air Conditioning", "Parking", "Projector", "Sound System", "Wheelchair Access"],
    image: "hall-3.jpg"
  }
};

// Get hall parameter from URL
const params = new URLSearchParams(window.location.search);
const hallParam = params.get('hall');

// Load hall details
if (hallParam && hallsData[hallParam]) {
  const hall = hallsData[hallParam];
  
  // Update page content
  document.getElementById('hall-image').src = hall.image;
  document.getElementById('hall-image').alt = hall.name;
  document.getElementById('hall-name').textContent = hall.name;
  document.getElementById('hall-location').textContent = hall.location;
  document.getElementById('hall-description').textContent = hall.description;
  document.getElementById('hall-capacity').textContent = `${hall.capacity} people`;
  document.getElementById('hall-cost').textContent = `${hall.costPerDay.toLocaleString('th-TH')} THB / day`;
  document.getElementById('hall-address').textContent = hall.address;

  // Fill sections
  document.getElementById('section-overview').textContent = hall.overview;
  document.getElementById('section-suitable').textContent = hall.suitableFor;
  document.getElementById('section-facilities').textContent = hall.facilities;
  document.getElementById('section-terms').textContent = hall.terms;

  // Amenities list
  const amenitiesList = document.getElementById('amenities-list');
  amenitiesList.innerHTML = '';
  (hall.amenities || []).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    amenitiesList.appendChild(li);
  });
  
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('start-date').setAttribute('min', today);
  document.getElementById('end-date').setAttribute('min', today);
  
  // Handle date validation
  document.getElementById('start-date').addEventListener('change', function() {
    const startDate = this.value;
    document.getElementById('end-date').setAttribute('min', startDate);
    
    // Clear end date if it's before start date
    const endDate = document.getElementById('end-date').value;
    if (endDate && endDate < startDate) {
      document.getElementById('end-date').value = '';
    }
  });
  
  // Book Now button
  document.getElementById('book-now-btn').addEventListener('click', function() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    if (endDate < startDate) {
      alert('End date must be after start date');
      return;
    }
    
    // Validate availability for the selected date range
    const rangeDates = getDateRange(startDate, endDate);
    const availabilityMap = loadAvailability(hall.id);
    const unavailableInRange = rangeDates.some(d => availabilityMap[d] === false);
    if (unavailableInRange) {
      alert('Selected range includes unavailable dates. Please choose different dates.');
      return;
    }

    // Compute total price
    const rules = loadPricingRules(hall.id, hall.costPerDay);
    const total = rangeDates.reduce((sum, d) => sum + getPriceForDate(d, rules, hall.costPerDay), 0);

    // Redirect to booking page with parameters
    window.location.href = `booking.html?hall_id=${hall.id}&start=${startDate}&end=${endDate}&total=${total}`;
  });
  
  // Seed and render availability (next 30 days) from localStorage
  seedIfNeeded(hall.id, hall.costPerDay);
  renderAvailabilityTable(hall.id);

  // Render pricing rules table
  renderPricingTable(hall.id, hall.costPerDay);

  // Update pricing summary on date change
  const pricingSummaryEl = document.getElementById('pricing-summary');
  const dateHintEl = document.getElementById('date-hint');
  const onDateChange = () => {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const availabilityMap = loadAvailability(hall.id);

    // Mark inputs red if selected date is unavailable
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    const startUnavailable = startDate && availabilityMap[startDate] === false;
    const endUnavailable = endDate && availabilityMap[endDate] === false;
    startInput.classList.toggle('date-unavailable', !!startUnavailable);
    endInput.classList.toggle('date-unavailable', !!endUnavailable);

    // Show hint if any selected date is unavailable
    if (startUnavailable || endUnavailable) {
      dateHintEl.style.display = '';
      dateHintEl.textContent = 'One or more selected dates are unavailable. Please choose different dates.';
    } else {
      dateHintEl.style.display = 'none';
      dateHintEl.textContent = '';
    }

    if (!startDate || !endDate || endDate < startDate) {
      pricingSummaryEl.textContent = '';
      return;
    }
    const rules = loadPricingRules(hall.id, hall.costPerDay);
    const dates = getDateRange(startDate, endDate);
    const hasUnavailable = dates.some(d => availabilityMap[d] === false);
    const total = dates.reduce((sum, d) => sum + getPriceForDate(d, rules, hall.costPerDay), 0);
    pricingSummaryEl.textContent = `${dates.length} day(s) • Total: ${total.toLocaleString('th-TH')} THB` + (hasUnavailable ? ' • Includes unavailable dates' : '');
  };
  document.getElementById('start-date').addEventListener('change', onDateChange);
  document.getElementById('end-date').addEventListener('change', onDateChange);
  // Initial check
  onDateChange();

  // Map embed
  const mapFrame = document.getElementById('map-frame');
  if (mapFrame) {
    const url = hall.coords
      ? `https://www.google.com/maps?q=${hall.coords.lat},${hall.coords.lng}&hl=en&z=15&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(hall.address || hall.name)}&hl=en&z=15&output=embed`;
    mapFrame.src = url;
  }

} else {
  // If no valid hall parameter, show error
  document.getElementById('hall-name').textContent = 'Hall not found';
  document.getElementById('hall-description').textContent = 'Please select a valid hall from the halls page.';
}

// ===== Helpers: Storage-backed pricing and availability =====
function storageKeyAvailability(hallId) {
  return `salabook:availability:${hallId}`;
}
function storageKeyPricing(hallId) {
  return `salabook:pricing:${hallId}`;
}

function seedIfNeeded(hallId, defaultPrice) {
  // Seed availability for next 30 days if missing
  if (!localStorage.getItem(storageKeyAvailability(hallId))) {
    const today = new Date();
    const map = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const randomBlock = Math.random() < 0.15;
      map[iso] = !(isWeekend || randomBlock); // available if not blocked
    }
    localStorage.setItem(storageKeyAvailability(hallId), JSON.stringify(map));
  }
  // Seed pricing rules if missing
  if (!localStorage.getItem(storageKeyPricing(hallId))) {
    const todayIso = new Date().toISOString().split('T')[0];
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    const in7Iso = in7.toISOString().split('T')[0];
    const rules = [
      // Promotional price for next week
      { start: todayIso, end: in7Iso, pricePerDay: Math.max(1, Math.round(defaultPrice * 0.9)) },
      // Default/fallback is handled by code when no rule matches
    ];
    localStorage.setItem(storageKeyPricing(hallId), JSON.stringify(rules));
  }
}

function loadAvailability(hallId) {
  try {
    return JSON.parse(localStorage.getItem(storageKeyAvailability(hallId))) || {};
  } catch {
    return {};
  }
}

function loadPricingRules(hallId, defaultPrice) {
  try {
    const rules = JSON.parse(localStorage.getItem(storageKeyPricing(hallId))) || [];
    // Normalize: ensure valid dates and price
    return rules.filter(r => r && r.start && r.end && r.pricePerDay > 0);
  } catch {
    return [];
  }
}

function getPriceForDate(isoDate, rules, defaultPrice) {
  const d = new Date(isoDate);
  for (const r of rules) {
    const s = new Date(r.start);
    const e = new Date(r.end);
    if (d >= s && d <= e) return r.pricePerDay;
  }
  return defaultPrice;
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

function renderAvailabilityTable(hallId) {
  const availabilityTable = document.getElementById('availability-table');
  if (!availabilityTable) return;
  availabilityTable.innerHTML = '';
  const header = document.createElement('tr');
  const th1 = document.createElement('th'); th1.textContent = 'Date';
  const th2 = document.createElement('th'); th2.textContent = 'Status';
  header.appendChild(th1); header.appendChild(th2);
  availabilityTable.appendChild(header);

  const map = loadAvailability(hallId);
  const dates = Object.keys(map).sort();
  dates.forEach(iso => {
    const tr = document.createElement('tr');
    const tdDate = document.createElement('td'); tdDate.textContent = iso;
    const tdStatus = document.createElement('td');
    const available = map[iso] !== false ? true : false;
    tdStatus.textContent = available ? 'Available' : 'Unavailable';
    tdStatus.className = available ? 'available' : 'unavailable';
    tdDate.className = available ? 'available' : 'unavailable';
    tr.appendChild(tdDate); tr.appendChild(tdStatus);
    availabilityTable.appendChild(tr);
  });
}

function renderPricingTable(hallId, defaultPrice) {
  const table = document.getElementById('pricing-table');
  if (!table) return;
  table.innerHTML = '';
  const header = document.createElement('tr');
  ['Start', 'End', 'Price per day (THB)'].forEach(h => {
    const th = document.createElement('th'); th.textContent = h; header.appendChild(th);
  });
  table.appendChild(header);

  const rules = loadPricingRules(hallId, defaultPrice);
  if (rules.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent = `Default: ${defaultPrice.toLocaleString('th-TH')} THB / day`;
    tr.appendChild(td);
    table.appendChild(tr);
  } else {
    rules.forEach(r => {
      const tr = document.createElement('tr');
      const tdS = document.createElement('td'); tdS.textContent = r.start;
      const tdE = document.createElement('td'); tdE.textContent = r.end;
      const tdP = document.createElement('td'); tdP.textContent = r.pricePerDay.toLocaleString('th-TH');
      tr.appendChild(tdS); tr.appendChild(tdE); tr.appendChild(tdP);
      table.appendChild(tr);
    });
    // Mention default after rules
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.textContent = `Default (outside rules): ${defaultPrice.toLocaleString('th-TH')} THB / day`;
    tr.appendChild(td);
    table.appendChild(tr);
  }
}