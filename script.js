// This script has been significantly updated to add new features,
// professional animations, and improve user experience.
// It now includes a 'Showcase' section for favorite cars, a 'Stats for Nerds'
// section with a Chart.js graph, and a custom message box to replace 'alert()'.

const carForm = document.getElementById('carForm');
const collectionDiv = document.getElementById('collection');
const errorDiv = document.getElementById('error');
const submitBtn = document.getElementById('submitBtn');
const entryCount = document.getElementById('entryCount');
const filterPack = document.getElementById('filterPack');
const filterCategory = document.getElementById('filterCategory');
const sortOption = document.getElementById('sortOption');
const viewToggleBtn = document.getElementById('viewToggleBtn');
const inputSection = document.getElementById('inputSection');
const collectionSection = document.getElementById('collectionSection');

const showcaseSection = document.getElementById('showcaseSection');
const statsSection = document.getElementById('statsSection');
const toggleStatsBtn = document.getElementById('toggleStatsBtn');
const showcaseGrid = document.querySelector('.showcase-grid');
const carValueChartCanvas = document.getElementById('carValueChart');

const modal = document.getElementById('cardModal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');

const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const messageOkBtn = document.getElementById('messageOkBtn');
const messageCancelBtn = document.getElementById('messageCancelBtn');

// NEW: Get the hero CTA button
const heroAddCarBtn = document.getElementById('heroAddCarBtn');


let collection = JSON.parse(localStorage.getItem('hwCollection')) || [];
let favorites = JSON.parse(localStorage.getItem('hwFavorites')) || [];
let editIndex = -1;

// Chart.js instance variable
let carValueChart;

/**
 * Renders the main collection of cars based on filters and sorting.
 */
function renderCollection() {
  collectionDiv.innerHTML = '';

  let filtered = [...collection];

  const selectedPack = filterPack.value;
  const selectedCategory = filterCategory.value;
  const sortBy = sortOption.value;

  if (selectedPack) {
    filtered = filtered.filter(car => car.packStatus === selectedPack);
  }

  if (selectedCategory) {
    filtered = filtered.filter(car => car.category === selectedCategory);
  }

  // Sorting
  if (sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'price') {
    filtered.sort((a, b) => b.value - a.value);
  }

  // Update the total item count
  entryCount.textContent = `Total Items: ${filtered.length}`;

  if (filtered.length === 0) {
    collectionDiv.innerHTML = '<p>No cars match this filter. Try adjusting your filters or add a new car.</p>';
    return;
  }

  const isDarkMode = document.body.classList.contains('dark');

  filtered.forEach((car, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => showCardDetails(car);
    if (isDarkMode) {
      card.classList.add('dark-glow');
    }

    const img = document.createElement('img');
    img.src = car.image;
    img.alt = car.name;
    img.onerror = () => {
        img.src = `https://placehold.co/400x300/e30613/ffffff?text=Image+Not+Found`;
    };

    const favIcon = document.createElement('div');
    favIcon.className = 'favorite-icon';
    favIcon.innerHTML = favorites.includes(car.name) ? '❤️' : '🤍';
    if (favorites.includes(car.name)) favIcon.classList.add('favorited');
    favIcon.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(car.name);
    };

    const content = document.createElement('div');
    content.className = 'card-content';

    const title = document.createElement('h3');
    title.textContent = car.name;

    const value = document.createElement('p');
    value.textContent = `₹${car.value}`;

    const rating = document.createElement('div');
    rating.className = 'rating';
    rating.innerHTML = '⭐'.repeat(car.rating || 0);

    content.appendChild(title);
    content.appendChild(value);
    content.appendChild(rating);

    const btnContainer = document.createElement('div');
    btnContainer.className = 'card-buttons';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'edit';
    btnEdit.textContent = 'Edit';
    btnEdit.onclick = (e) => {
      e.stopPropagation();
      startEdit(index);
    };

    const btnDelete = document.createElement('button');
    btnDelete.className = 'delete';
    btnDelete.textContent = 'Delete';
    btnDelete.onclick = (e) => {
      e.stopPropagation();
      showConfirmDelete(index); // Use custom message box
    };

    btnContainer.appendChild(btnEdit);
    btnContainer.appendChild(btnDelete);

    card.appendChild(favIcon);
    card.appendChild(img);
    card.appendChild(content);
    card.appendChild(btnContainer);

    collectionDiv.appendChild(card);
  });

  updateShowcase();
}

/**
 * Renders the showcase section with a few favorite cars.
 */
function updateShowcase() {
  showcaseGrid.innerHTML = '';
  const showcaseCars = collection.filter(car => favorites.includes(car.name)).slice(0, 4);
  if (showcaseCars.length === 0) {
      showcaseSection.classList.add('hidden');
      return;
  } else {
      showcaseSection.classList.remove('hidden');
  }

  showcaseCars.forEach(car => {
    const card = document.createElement('div');
    card.className = 'showcase-card';
    card.innerHTML = `
      <img src="${car.image}" alt="${car.name}" onerror="this.src='https://placehold.co/400x300/e30613/ffffff?text=Image+Not+Found'">
      <h3>${car.name}</h3>
      <p>₹${car.value} | Rating: ${'⭐'.repeat(car.rating)}</p>
    `;
    showcaseGrid.appendChild(card);
  });
}

/**
 * Updates the Chart.js graph with collection data.
 */
function updateChart() {
  // Group cars by pack status and calculate average value
  const packStatusData = collection.reduce((acc, car) => {
    if (!acc[car.packStatus]) {
      acc[car.packStatus] = { totalValue: 0, count: 0 };
    }
    acc[car.packStatus].totalValue += car.value;
    acc[car.packStatus].count++;
    return acc;
  }, {});

  const labels = Object.keys(packStatusData);
  const data = labels.map(key => packStatusData[key].totalValue / packStatusData[key].count);

  const chartData = {
    labels: labels,
    datasets: [{
      label: 'Average Value by Pack Status',
      data: data,
      backgroundColor: [
        'rgba(46, 204, 113, 0.7)', // Opened (Green)
        'rgba(241, 196, 15, 0.7)', // In-Pack (Yellow)
      ],
      borderColor: [
        'rgba(46, 204, 113, 1)',
        'rgba(241, 196, 15, 1)',
      ],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Average Value by Pack Status',
        color: document.body.classList.contains('dark') ? '#ecf0f1' : '#2c3e50'
      },
      tooltip: {
        callbacks: {
          label: (context) => `Avg. Value: ₹${context.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: document.body.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
        ticks: { color: document.body.classList.contains('dark') ? '#95a5a6' : '#7f8c8d' }
      },
      x: {
        grid: { display: false },
        ticks: { color: document.body.classList.contains('dark') ? '#95a5a6' : '#7f8c8d' }
      }
    }
  };

  // Destroy old chart instance if it exists to prevent memory leaks
  if (carValueChart) {
    carValueChart.destroy();
  }

  // Create the new chart
  const ctx = carValueChartCanvas.getContext('2d');
  carValueChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: chartOptions
  });
}


/**
 * Displays a custom confirmation message box.
 * @param {string} message The message to display.
 * @param {Function} onOk Callback for the 'OK' button.
 * @param {Function} onCancel Callback for the 'Cancel' button.
 */
function showConfirm(message, onOk, onCancel) {
    messageText.textContent = message;
    messageBox.style.display = 'flex';

    const okHandler = () => {
        messageBox.style.display = 'none';
        onOk();
        messageOkBtn.removeEventListener('click', okHandler);
        messageCancelBtn.removeEventListener('click', cancelHandler);
    };

    const cancelHandler = () => {
        messageBox.style.display = 'none';
        if (onCancel) onCancel();
        messageOkBtn.removeEventListener('click', okHandler);
        messageCancelBtn.removeEventListener('click', cancelHandler);
    };

    messageOkBtn.addEventListener('click', okHandler);
    messageCancelBtn.addEventListener('click', cancelHandler);
}

/**
 * Handles the custom delete confirmation logic.
 * @param {number} index The index of the car to delete.
 */
function showConfirmDelete(index) {
    showConfirm(
        'Are you sure you want to delete this car? This action cannot be undone.',
        () => deleteCar(index)
    );
}

/**
 * Displays modal with car details.
 * @param {object} car The car object to display.
 */
function showCardDetails(car) {
  modalBody.innerHTML = `
    <img src="${car.image}" alt="${car.name}" onerror="this.src='https://placehold.co/600x400/e30613/ffffff?text=Image+Not+Found'">
    <div class="modal-text">
      <h3>${car.name}</h3>
      <p><strong>Value:</strong> ₹${car.value}</p>
      <p><strong>Type:</strong> ${car.type || 'N/A'}</p>
      <p><strong>Pack:</strong> ${car.packStatus || 'N/A'}</p>
      <p><strong>Category:</strong> ${car.category || 'N/A'}</p>
      <p><strong>Rating:</strong> <span class="rating">${'⭐'.repeat(car.rating || 0)}</span></p>
      ${car.wiki ? `<a href="${car.wiki}" target="_blank" class="btn btn-secondary">View Wiki Info</a>` : ''}
      ${car.marketplace ? `<a href="${car.marketplace}" target="_blank" class="btn btn-secondary">Buy Online</a>` : ''}
    </div>
  `;
  modal.style.display = 'flex';
}

/**
 * Toggles a car as a favorite.
 * @param {string} name The name of the car.
 */
function toggleFavorite(name) {
  if (favorites.includes(name)) {
    favorites = favorites.filter(fav => fav !== name);
  } else {
    favorites.push(name);
  }
  localStorage.setItem('hwFavorites', JSON.stringify(favorites));
  renderCollection();
}

carForm.addEventListener('submit', e => {
  e.preventDefault();
  errorDiv.textContent = '';

  const name = carForm.name.value.trim();
  const value = parseInt(carForm.value.value.trim());
  const image = carForm.image.value.trim();
  const type = carForm.type.value;
  const packStatus = carForm.packStatus.value;
  const category = carForm.category.value;
  const rating = parseInt(carForm.rating.value.trim());
  const wiki = carForm.wiki.value.trim();
  const marketplace = carForm.marketplace.value.trim();

  if (!name || !image || isNaN(value) || value < 0 || rating < 0 || rating > 5) {
    errorDiv.textContent = 'Please fill all required fields correctly.';
    return;
  }

  const carObj = { name, value, image, type, packStatus, category, rating, wiki, marketplace };

  if (editIndex === -1) {
    collection.push(carObj);
  } else {
    collection[editIndex] = carObj;
    editIndex = -1;
    submitBtn.textContent = 'Add to Collection';
    submitBtn.innerHTML = `<i class="fas fa-plus-circle"></i> Add to Collection`;
  }

  localStorage.setItem('hwCollection', JSON.stringify(collection));
  carForm.reset();
  renderCollection();
});

/**
 * Starts the editing process for a car.
 * @param {number} index The index of the car to edit.
 */
function startEdit(index) {
  const car = collection[index];
  carForm.name.value = car.name;
  carForm.value.value = car.value;
  carForm.image.value = car.image;
  carForm.type.value = car.type;
  carForm.packStatus.value = car.packStatus;
  carForm.category.value = car.category;
  carForm.rating.value = car.rating;
  carForm.wiki.value = car.wiki;
  carForm.marketplace.value = car.marketplace;

  editIndex = index;
  submitBtn.textContent = 'Update Car';
  submitBtn.innerHTML = `<i class="fas fa-edit"></i> Update Car`;

  if (inputSection.classList.contains('hidden')) {
    inputSection.classList.remove('hidden');
    collectionSection.classList.add('hidden');
    showcaseSection.classList.add('hidden');
    statsSection.classList.add('hidden');
    viewToggleBtn.innerHTML = `<i class="fas fa-car"></i> View Collection`;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Deletes a car from the collection.
 * @param {number} index The index of the car to delete.
 */
function deleteCar(index) {
  collection.splice(index, 1);
  localStorage.setItem('hwCollection', JSON.stringify(collection));
  if (editIndex === index) {
    carForm.reset();
    editIndex = -1;
    submitBtn.textContent = 'Add to Collection';
    submitBtn.innerHTML = `<i class="fas fa-plus-circle"></i> Add to Collection`;
  }
  renderCollection();
}

// Dark mode toggle
document.getElementById('toggleMode').addEventListener('change', (e) => {
  const allCards = document.querySelectorAll('.card');

  if (e.target.checked) {
    document.body.classList.add('dark');
    localStorage.setItem('hwDarkMode', 'enabled');
    // Add glow to all existing cards
    allCards.forEach(card => card.classList.add('dark-glow'));
    // Update chart colors
    if (!statsSection.classList.contains('hidden')) {
      updateChart();
    }
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('hwDarkMode', 'disabled');
    // Remove glow from all existing cards
    allCards.forEach(card => card.classList.remove('dark-glow'));
    // Update chart colors
    if (!statsSection.classList.contains('hidden')) {
      updateChart();
    }
  }
});


// View/Hide Form and Collection sections
viewToggleBtn.addEventListener('click', () => {
  const isFormVisible = !inputSection.classList.contains('hidden');

  if (isFormVisible) {
    inputSection.classList.add('hidden');
    collectionSection.classList.remove('hidden');
    showcaseSection.classList.remove('hidden');
    if (!statsSection.classList.contains('hidden')) {
        statsSection.classList.add('hidden');
    }
    viewToggleBtn.innerHTML = `<i class="fas fa-plus-circle"></i> Add New Car`;
  } else {
    inputSection.classList.remove('hidden');
    collectionSection.classList.remove('hidden');
    showcaseSection.classList.remove('hidden');
    if (!statsSection.classList.contains('hidden')) {
        statsSection.classList.add('hidden');
    }
    viewToggleBtn.innerHTML = `<i class="fas fa-car"></i> View Collection`;
  }
});

// Toggle Stats section
toggleStatsBtn.addEventListener('click', () => {
    statsSection.classList.toggle('hidden');
    if (!statsSection.classList.contains('hidden')) {
        updateChart(); // Render chart only when it's visible
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
});

// NEW: Event listener for the Hero CTA button
heroAddCarBtn.addEventListener('click', () => {
  // Simulate clicking the "Add New Car" button in the header
  viewToggleBtn.click();
  // Scroll to the form section
  inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});


// Fix for filters not updating
filterPack.addEventListener('change', () => {
  renderCollection();
});

filterCategory.addEventListener('change', () => {
  renderCollection();
});

sortOption.addEventListener('change', () => {
  renderCollection();
});

// Modal close logic
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// Initial render
window.onload = () => {
  // Check localStorage for dark mode preference on load
  if (localStorage.getItem('hwDarkMode') === 'enabled') {
    document.body.classList.add('dark');
    document.getElementById('toggleMode').checked = true;
  }
  renderCollection();
};