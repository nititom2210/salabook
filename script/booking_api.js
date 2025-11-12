/**
 * Booking with API Backend
 * Include this AFTER api.js
 */

const params = new URLSearchParams(location.search);
const hallId = params.get("hall_id");
const start = params.get("start");
const end = params.get("end");
const total = params.get("total");

// Get hall data from API
let halls = [];
api.getHalls().then(response => {
  halls = response.data || [];
  const hall = halls.find(h => h.id == hallId);
  if (hall) {
    document.getElementById("hall_id").value = hallId;
    document.getElementById("hall_name").value = hall.name || "";
  }
}).catch(err => console.error('Error loading halls:', err));

// Fill dates if provided
if (start) document.getElementById("start_date").value = start;
if (end) document.getElementById("end_date").value = end;

// Show total if provided
if (total) {
  const form = document.getElementById("booking-form");
  const p = document.createElement("p");
  p.style.fontWeight = "600";
  p.textContent = `Estimated total: ${Number(total).toLocaleString('th-TH')} THB`;
  form.insertBefore(p, form.querySelector("button[type='submit']"));
}

// Submit booking
document.getElementById("booking-form").addEventListener("submit", async e => {
  e.preventDefault();
  
  const hallIdNum = Number(document.getElementById("hall_id").value);
  const startDate = document.getElementById("start_date").value;
  const endDate = document.getElementById("end_date").value;
  const eventName = document.getElementById("funeral_name").value;
  const contactName = document.getElementById("contact_name")?.value;
  const contactPhone = document.getElementById("contact_phone")?.value;
  const contactEmail = document.getElementById("contact_email")?.value;
  const notes = document.getElementById("notes")?.value;

  // Check session
  try {
    const sessionResponse = await api.getSession();
    if (!sessionResponse || !sessionResponse.data || !sessionResponse.data.user) {
      alert("Please login before making a booking.");
      return;
    }
  } catch (error) {
    alert("Please login before making a booking.");
    return;
  }

  if (!startDate || !endDate) {
    alert("Please select both start and end dates.");
    return;
  }
  if (endDate < startDate) {
    alert("End date must be after start date.");
    return;
  }
  if (!eventName || !contactName || !contactPhone) {
    alert("Please fill Event Name, Contact Name, and Phone.");
    return;
  }

  // Check availability
  try {
    const availabilityResponse = await api.checkAvailability(hallIdNum, startDate, endDate);
    if (!availabilityResponse.data.available) {
      alert("Your selected dates include unavailable days. Please change the range.");
      return;
    }
  } catch (error) {
    alert("Error checking availability: " + error.message);
    return;
  }

  // Create booking
  try {
    const bookingData = {
      hall_id: hallIdNum,
      start_date: startDate,
      end_date: endDate,
      event_name: eventName,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail || null,
      notes: notes || null
    };

    const response = await api.createBooking(bookingData);
    const bookingId = response.data.id;
    
    // Redirect to payment page
    window.location.href = `payment.html?booking_id=${bookingId}`;
  } catch (error) {
    alert("Error creating booking: " + error.message);
  }
});

