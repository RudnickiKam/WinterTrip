const tripSelect = document.getElementById("trip-select");
const tripDescription = document.getElementById("trip-description");
const destinationsContainer = document.getElementById("destinations");
const destinationToggleContainer = document.getElementById("destination-toggle");
const accommodationDaysRange = document.getElementById("accommodation-days-range");
const accommodationDaysValue = document.getElementById("accommodation-days-value");
const accommodationPricePerPerson = document.getElementById("accommodation-price-per-person");
const skiDaysRange = document.getElementById("ski-days-range");
const skiDaysValue = document.getElementById("ski-days-value");
const skiPricePerPerson = document.getElementById("ski-price-per-person");
const peopleCount = document.getElementById("people-count");
const equipmentContainer = document.getElementById("equipment-options");
const totalPerPerson = document.getElementById("total-per-person");

let trips = [];
let destinations = [];
let selectedTrip = null;
let selectedDestinationId = null;
let map = null;
let markers = [];

async function loadData() {
  try {
    const [tripsResponse, destinationsResponse] = await Promise.all([
      fetch("data/trips.json"),
      fetch("data/destinations.json")
    ]);

    trips = await tripsResponse.json();
    destinations = await destinationsResponse.json();
    initMap();
    renderTripSelector();
    selectTrip(trips[0]?.id);
  } catch (error) {
    console.error("Failed to load data:", error);
    tripSelect.innerHTML = "<option>Error loading trips</option>";
    equipmentContainer.innerHTML = "<p>Unable to load equipment options.</p>";
  }
}

function initMap() {
  if (!window.L) {
    console.warn("Leaflet is not available.");
    return;
  }

  map = L.map("map", { zoomControl: true }).setView([51.0, 17.0], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 100);
}

function renderTripSelector() {
  tripSelect.innerHTML = trips
    .map((trip) => `<option value="${trip.id}">${trip.title}</option>`)
    .join("");
  tripSelect.addEventListener("change", () => selectTrip(tripSelect.value));
}

function selectTrip(tripId) {
  selectedTrip = trips.find((trip) => trip.id === tripId);
  if (!selectedTrip) return;
  selectedDestinationId = selectedTrip.destinationIds[0] || null;
  tripDescription.textContent = selectedTrip.description;
  accommodationDaysRange.value = selectedTrip.defaultDays;
  accommodationDaysValue.textContent = selectedTrip.defaultDays;
  skiDaysRange.value = selectedTrip.defaultDays;
  skiDaysValue.textContent = selectedTrip.defaultDays;
  peopleCount.value = selectedTrip.defaultPeople;
  renderDestinations();
  renderDestinationToggle();
  renderEquipmentOptions();
  updateTotals();
  updateMap();
}

function renderDestinations() {
  const chosenDestinations = destinations.filter((destination) =>
    selectedTrip.destinationIds.includes(destination.id)
  );

  destinationsContainer.innerHTML = chosenDestinations
    .map(createDestinationCard)
    .join("");

  attachAccommodationListeners();
}

function renderDestinationToggle() {
  const chosenDestinations = destinations.filter((destination) =>
    selectedTrip.destinationIds.includes(destination.id)
  );

  if (chosenDestinations.length <= 1) {
    destinationToggleContainer.innerHTML = "";
    if (chosenDestinations[0]) {
      selectedDestinationId = chosenDestinations[0].id;
    }
    return;
  }

  destinationToggleContainer.innerHTML = `
    <p class="destination-toggle-label">Choose resort for estimate:</p>
    <div class="destination-toggle-buttons">
      ${chosenDestinations
        .map(
          (destination) =>
            `<button type="button" data-id="${destination.id}" class="${selectedDestinationId === destination.id ? "active" : ""}">${destination.name}</button>`
        )
        .join("")}
    </div>
  `;

  const buttons = destinationToggleContainer.querySelectorAll("button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedDestinationId = button.dataset.id;
      renderDestinationToggle();
      renderEquipmentOptions();
      updateTotals();
      updateMap();
    });
  });
}

function createDestinationCard(destination) {
  const stayDays = Number(accommodationDaysRange.value);
  const accommodationsHtml = destination.accommodations
    .map((item, index) => {
      const accommodationRate = item.accommodationRates?.[String(stayDays)] ?? 0;
      return `
      <li class="accommodation-row">
        <div class="accommodation-choice">
          <label>
            <input
              type="radio"
              name="accommodation-${destination.id}"
              value="${index}"
              ${index === 0 ? "checked" : ""}
            />
            <span class="accommodation-name">${item.name}</span>
          </label>
          <span class="accommodation-price" data-destination-id="${destination.id}" data-accommodation-index="${index}">${accommodationRate} PLN / stay</span>
          <a class="accommodation-link" href="${item.link}" target="_blank" rel="noopener">Book</a>
        </div>
        <p class="accommodation-description">${item.description || "Short accommodation description will appear here."}</p>
      </li>`;
    })
    .join("");

  return `
    <article class="destination-card">
      <h3>${destination.name}</h3>
      <p>${destination.summary}</p>
      <p><em>${destination.notes}</em></p>
      <div class="destination-details">
        <p><strong>Distance from Wrocław:</strong> ${destination.distanceKm} km</p>
        <p><strong>Skipass:</strong> ${destination.skipassCostPerDay} PLN / day</p>
        <p><strong>Fuel estimate:</strong> ${destination.fuelCostEstimate} PLN</p>
        <p><strong>Resort map:</strong> ${destination.resortMapLink ? `<a href="${destination.resortMapLink}" target="_blank" rel="noopener">View trail map</a>` : "Not available"}</p>
      </div>
      <h4>Accommodations</h4>
      <ul class="accommodation-list">${accommodationsHtml}</ul>
    </article>`;
}

function attachAccommodationListeners() {
  const accommodationInputs = document.querySelectorAll(
    'input[type="radio"][name^="accommodation-"]'
  );
  accommodationInputs.forEach((input) => {
    input.addEventListener("change", updateTotals);
  });
}

function updateAccommodationPriceLabels() {
  const stayDays = Number(accommodationDaysRange.value);
  const priceLabels = document.querySelectorAll(
    '.accommodation-price[data-destination-id][data-accommodation-index]'
  );

  priceLabels.forEach((label) => {
    const destinationId = label.dataset.destinationId;
    const index = Number(label.dataset.accommodationIndex);
    const destination = destinations.find((dest) => dest.id === destinationId);
    const rate = destination?.accommodations?.[index]?.accommodationRates?.[String(stayDays)] ?? 0;
    label.textContent = `${rate} PLN / stay`;
  });
}

function renderEquipmentOptions() {
  const chosenDestinations = getActiveDestinations();

  if (!chosenDestinations.length) {
    equipmentContainer.innerHTML = "<p>Select a trip to see equipment options.</p>";
    return;
  }

  const options = getUniqueEquipmentOptions(chosenDestinations);
  equipmentContainer.innerHTML = `
    <h3>Equipment add-ons</h3>
    <p class="equipment-description">Select rental gear for your trip and include it in the total estimate.</p>
    ${options
      .map((item) => `
        <label class="equipment-item">
          <input type="checkbox" name="equipment-option" value="${item.id}" />
          <span class="equipment-name">${item.name}</span>
          <span class="equipment-price">${item.pricePerDay} PLN / day</span>
        </label>`)
      .join("")}`;

  const equipmentInputs = equipmentContainer.querySelectorAll(
    'input[type="checkbox"][name="equipment-option"]'
  );
  equipmentInputs.forEach((input) => input.addEventListener("change", updateTotals));
}

function getUniqueEquipmentOptions(chosenDestinations) {
  const optionMap = new Map();

  chosenDestinations.forEach((destination) => {
    destination.equipmentOptions.forEach((item) => {
      if (!optionMap.has(item.id) || optionMap.get(item.id).pricePerDay > item.pricePerDay) {
        optionMap.set(item.id, item);
      }
    });
  });

  return Array.from(optionMap.values());
}

function getSelectedEquipmentCost() {
  const checkedInputs = Array.from(
    equipmentContainer.querySelectorAll(
      'input[type="checkbox"][name="equipment-option"]:checked'
    )
  );

  const chosenDestinations = getActiveDestinations();

  return checkedInputs.reduce((sum, input) => {
    const item = chosenDestinations
      .flatMap((destination) => destination.equipmentOptions)
      .find((option) => option.id === input.value);
    return sum + (item?.pricePerDay || 0);
  }, 0);
}

function getSelectedAccommodationCost(destination) {
  const stayDays = Number(accommodationDaysRange.value);
  const selectedInput = document.querySelector(
    `input[name="accommodation-${destination.id}"]:checked`
  );
  const selectedIndex = Number(selectedInput?.value ?? 0);
  return destination.accommodations[selectedIndex]?.accommodationRates?.[String(stayDays)] ||
    destination.accommodations[0]?.accommodationRates?.[String(stayDays)] ||
    0;
}

function getActiveDestinations() {
  if (!selectedTrip) {
    return [];
  }

  const chosenDestinations = destinations.filter((destination) =>
    selectedTrip.destinationIds.includes(destination.id)
  );

  const selectedDestination = chosenDestinations.find(
    (destination) => destination.id === selectedDestinationId
  );

  if (selectedDestination) {
    return [selectedDestination];
  }

  return chosenDestinations.length ? [chosenDestinations[0]] : [];
}

function updateTotals() {
  const accommodationDays = Number(accommodationDaysRange.value);
  const skiDays = Number(skiDaysRange.value);
  const people = Math.max(1, Number(peopleCount.value));
  accommodationDaysValue.textContent = accommodationDays;
  skiDaysValue.textContent = skiDays;

  const chosenDestinations = getActiveDestinations();

  if (!chosenDestinations.length) {
    totalPerPerson.textContent = "-";
    return;
  }

  const accommodationTotal = chosenDestinations.reduce(
    (sum, destination) => sum + getSelectedAccommodationCost(destination),
    0
  );

  const skipassPerPersonTotal = chosenDestinations.reduce((sum, destination) => {
    const rate = destination.skipassRates?.[String(skiDays)];
    return sum + (rate?.pricePln ?? destination.skipassCostPerDay * skiDays);
  }, 0);

  const fuelTotal = chosenDestinations.reduce(
    (sum, destination) => sum + destination.fuelCostEstimate,
    0
  );

  const equipmentPerPersonTotal = getSelectedEquipmentCost() * skiDays;

  const accommodationPerPerson = Math.round(accommodationTotal / people);
  const skiPerPerson = Math.round(skipassPerPersonTotal);
  accommodationPricePerPerson.textContent = `${accommodationPerPerson} PLN / person`;
  skiPricePerPerson.textContent = `${skiPerPerson} PLN / person`;

  const perPerson = Math.round(
    accommodationTotal / people +
      skipassPerPersonTotal +
      equipmentPerPersonTotal +
      fuelTotal / people
  );
  totalPerPerson.textContent = `${perPerson} PLN`;
}

accommodationDaysRange.addEventListener("input", () => {
  updateTotals();
  updateAccommodationPriceLabels();
});
skiDaysRange.addEventListener("input", updateTotals);
peopleCount.addEventListener("input", updateTotals);

function updateMap() {
  if (!map) {
    return;
  }

  markers.forEach((marker) => marker.remove());
  markers = [];

  const chosenDestinations = getActiveDestinations();

  if (!chosenDestinations.length) {
    return;
  }

  const bounds = [];
  chosenDestinations.forEach((destination) => {
    if (destination.coordinates && Array.isArray(destination.coordinates)) {
      const resortMarker = L.marker(destination.coordinates)
        .addTo(map)
        .bindPopup(`<strong>${destination.name}</strong><br>${destination.summary}`);

      markers.push(resortMarker);
      bounds.push(destination.coordinates);
    }

    destination.skiLifts?.forEach((lift) => {
      if (lift.coordinates) {
        const liftMarker = L.marker(lift.coordinates)
          .addTo(map)
          .bindPopup(`<strong>Lift: ${lift.name}</strong><br>${lift.description}`);
        markers.push(liftMarker);
        bounds.push(lift.coordinates);
      }
    });

    destination.accommodations?.forEach((accommodation) => {
      if (accommodation.coordinates) {
        const stayMarker = L.marker(accommodation.coordinates)
          .addTo(map)
          .bindPopup(
            `<strong>Stay: ${accommodation.name}</strong><br>${accommodation.description}<br><a href="${accommodation.link}" target="_blank" rel="noopener">Book</a>`
          );
        markers.push(stayMarker);
        bounds.push(accommodation.coordinates);
      }
    });
  });

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [40, 40] });
    map.invalidateSize();
    setTimeout(() => map.invalidateSize(), 200);
  }
}

loadData();