const API_BASE = '/api';

// State
let authToken = localStorage.getItem('authToken');
let currentEditingAd = null;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const newAdBtn = document.getElementById('new-ad-btn');
const adsList = document.getElementById('ads-list');
const adsCount = document.getElementById('ads-count');
const adFormContainer = document.getElementById('ad-form-container');
const adForm = document.getElementById('ad-form');
const closeFormBtn = document.getElementById('close-form-btn');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const loginError = document.getElementById('login-error');
const imagePreview = document.getElementById('image-preview');
const adImageInput = document.getElementById('ad-image');

// Initialize
if (authToken) {
  verifyToken();
} else {
  showLogin();
}

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
newAdBtn.addEventListener('click', () => showAdForm());
closeFormBtn.addEventListener('click', hideAdForm);
cancelFormBtn.addEventListener('click', hideAdForm);
adForm.addEventListener('submit', handleAdSubmit);
adImageInput.addEventListener('change', handleImagePreview);

// Functions
async function verifyToken() {
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      showDashboard();
      loadAds();
    } else {
      localStorage.removeItem('authToken');
      authToken = null;
      showLogin();
    }
  } catch (error) {
    console.error('Token verification error:', error);
    showLogin();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const username = formData.get('username');
  const password = formData.get('password');

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      showDashboard();
      loadAds();
      loginError.classList.remove('show');
    } else {
      loginError.textContent = data.error || 'Login failed';
      loginError.classList.add('show');
    }
  } catch (error) {
    console.error('Login error:', error);
    loginError.textContent = 'Network error. Please try again.';
    loginError.classList.add('show');
  }
}

function handleLogout() {
  localStorage.removeItem('authToken');
  authToken = null;
  showLogin();
  adForm.reset();
  currentEditingAd = null;
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  dashboardScreen.classList.add('hidden');
}

function showDashboard() {
  loginScreen.classList.add('hidden');
  dashboardScreen.classList.remove('hidden');
}

async function loadAds() {
  try {
    const response = await fetch(`${API_BASE}/ads`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const ads = await response.json();
      displayAds(ads);
      adsCount.textContent = `${ads.length} ad${ads.length !== 1 ? 's' : ''}`;
    } else {
      console.error('Failed to load ads');
    }
  } catch (error) {
    console.error('Error loading ads:', error);
  }
}

function displayAds(ads) {
  if (ads.length === 0) {
    adsList.innerHTML = `
      <div class="empty-state">
        <h3>No ads yet</h3>
        <p>Create your first ad to get started</p>
      </div>
    `;
    return;
  }

  adsList.innerHTML = ads.map(ad => `
    <div class="ad-card">
      ${ad.image_url ? `
        <img src="${ad.image_url}" alt="${ad.title}" class="ad-image" onerror="this.style.display='none'">
      ` : '<div class="ad-image"></div>'}
      <div class="ad-content">
        <h3 class="ad-title">${escapeHtml(ad.title)}</h3>
        <p class="ad-description">${escapeHtml(ad.description)}</p>
        <div class="ad-meta">
          <span class="ad-badge category">${escapeHtml(ad.category)}</span>
          <span class="ad-badge ${ad.is_active ? 'active' : 'inactive'}">
            ${ad.is_active ? 'Active' : 'Inactive'}
          </span>
          <span class="ad-meta-item">${ad.timeframe_days} days</span>
          <span class="ad-meta-item">${formatDate(ad.created_at)}</span>
        </div>
        <div style="margin-top: 12px;">
          <a href="${escapeHtml(ad.cta_url)}" target="_blank" class="btn btn-secondary" style="text-decoration: none; display: inline-block;">
            View CTA URL
          </a>
        </div>
      </div>
      <div class="ad-actions">
        <button class="btn btn-primary" onclick="editAd(${ad.id})">Edit</button>
        <button class="btn btn-secondary" onclick="deleteAd(${ad.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function showAdForm(ad = null) {
  currentEditingAd = ad;
  const formTitle = document.getElementById('form-title');
  
  if (ad) {
    formTitle.textContent = 'Edit Ad';
    document.getElementById('ad-id').value = ad.id;
    document.getElementById('ad-title').value = ad.title;
    document.getElementById('ad-description').value = ad.description;
    document.getElementById('ad-cta-url').value = ad.cta_url;
    document.getElementById('ad-category').value = ad.category;
    document.getElementById('ad-timeframe').value = ad.timeframe_days;
    document.getElementById('ad-is-active').checked = ad.is_active === 1;
    
    if (ad.image_url) {
      imagePreview.innerHTML = `<img src="${ad.image_url}" alt="Preview">`;
    }
  } else {
    formTitle.textContent = 'Create New Ad';
    adForm.reset();
    imagePreview.innerHTML = '';
  }
  
  adFormContainer.classList.remove('hidden');
  document.getElementById('ads-list-container').classList.add('hidden');
}

function hideAdForm() {
  adFormContainer.classList.add('hidden');
  document.getElementById('ads-list-container').classList.remove('hidden');
  adForm.reset();
  currentEditingAd = null;
  imagePreview.innerHTML = '';
  adImageInput.value = '';
}

function handleImagePreview(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  }
}

async function handleAdSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const adId = formData.get('id');
  const isEdit = !!adId;

  try {
    const url = isEdit ? `${API_BASE}/ads/${adId}` : `${API_BASE}/ads`;
    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    if (response.ok) {
      hideAdForm();
      loadAds();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to save ad');
    }
  } catch (error) {
    console.error('Error saving ad:', error);
    alert('Network error. Please try again.');
  }
}

async function editAd(id) {
  try {
    const response = await fetch(`${API_BASE}/ads/${id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const ad = await response.json();
      showAdForm(ad);
    } else {
      alert('Failed to load ad');
    }
  } catch (error) {
    console.error('Error loading ad:', error);
    alert('Network error. Please try again.');
  }
}

async function deleteAd(id) {
  if (!confirm('Are you sure you want to delete this ad?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/ads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      loadAds();
    } else {
      alert('Failed to delete ad');
    }
  } catch (error) {
    console.error('Error deleting ad:', error);
    alert('Network error. Please try again.');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Make functions available globally for onclick handlers
window.editAd = editAd;
window.deleteAd = deleteAd;

