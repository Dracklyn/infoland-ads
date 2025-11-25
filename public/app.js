const API_BASE = '/api';

// State
let authToken = localStorage.getItem('authToken');
let currentEditingAd = null;
let allAds = []; // Store all ads
let currentFilter = 'all'; // 'all', 'active', 'inactive'
let searchQuery = ''; // Current search query
let searchDebounceTimer = null; // Debounce timer for search

// DOM Elements - will be initialized when DOM is ready
let loginScreen, dashboardScreen, loginForm, logoutBtn, newAdBtn;
let adsList, adsCount, adFormContainer, adForm;
let closeFormBtn, cancelFormBtn, loginError, imagePreview, adImageInput;
let searchInput, clearSearchBtn;

// Initialize DOM elements
function initDOMElements() {
  loginScreen = document.getElementById('login-screen');
  dashboardScreen = document.getElementById('dashboard-screen');
  loginForm = document.getElementById('login-form');
  logoutBtn = document.getElementById('logout-btn');
  newAdBtn = document.getElementById('new-ad-btn');
  adsList = document.getElementById('ads-list');
  adsCount = document.getElementById('ads-count');
  adFormContainer = document.getElementById('ad-form-container');
  adForm = document.getElementById('ad-form');
  closeFormBtn = document.getElementById('close-form-btn');
  cancelFormBtn = document.getElementById('cancel-form-btn');
  loginError = document.getElementById('login-error');
  imagePreview = document.getElementById('image-preview');
  adImageInput = document.getElementById('ad-image');
  searchInput = document.getElementById('search-input');
  clearSearchBtn = document.getElementById('clear-search');
  
  if (!adsList) {
    console.error('ads-list element not found in DOM!');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDOMElements();
    setupEventListeners();
    initializeApp();
  });
} else {
  initDOMElements();
  setupEventListeners();
  initializeApp();
}

function setupEventListeners() {
  if (!loginForm || !logoutBtn || !newAdBtn || !adForm) {
    console.error('Some DOM elements not found for event listeners');
    return;
  }
  
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  newAdBtn.addEventListener('click', () => showAdForm());
  closeFormBtn.addEventListener('click', hideAdForm);
  cancelFormBtn.addEventListener('click', hideAdForm);
  adForm.addEventListener('submit', handleAdSubmit);
  adImageInput.addEventListener('change', handleImagePreview);
  
  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        clearSearch();
      }
    });
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearSearch);
  }
}

function initializeApp() {
  // Initialize
  if (authToken) {
    verifyToken();
  } else {
    showLogin();
  }
}

// Filter button listeners - use event delegation since buttons are in HTML
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('filter-btn')) {
    const filter = e.target.dataset.filter;
    if (filter) {
      setFilter(filter);
    }
  }
  
  // Event delegation for ad action buttons (replaces inline onclick handlers)
  const button = e.target.closest('button[data-action]');
  if (button) {
    const action = button.dataset.action;
    const adId = parseInt(button.dataset.adId);
    
    if (!adId || isNaN(adId)) {
      console.error('Invalid ad ID:', button.dataset.adId);
      return;
    }
    
    switch (action) {
      case 'toggle':
        const newStatus = button.dataset.newStatus === 'true';
        toggleAdStatus(adId, newStatus);
        break;
      case 'edit':
        editAd(adId);
        break;
      case 'delete':
        deleteAd(adId);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }
});

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
  // Initialize filter buttons UI (but don't apply filter until ads are loaded)
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.filter === 'all') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  currentFilter = 'all';
}

async function loadAds() {
  // Show skeleton loader
  showSkeletonLoader();
  
  try {
    const response = await fetch(`${API_BASE}/ads`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const ads = await response.json();
      console.log('✅ API Response received:', ads);
      
      if (!Array.isArray(ads)) {
        console.error('❌ Ads is not an array:', typeof ads, ads);
        if (adsList) {
          adsList.innerHTML = '<div class="empty-state"><h3>Error loading ads</h3><p>Invalid response format</p></div>';
        }
        return;
      }
      
      if (ads.length === 0) {
        console.log('No ads in response');
        allAds = [];
        if (adsList) {
          adsList.innerHTML = '<div class="empty-state"><h3>No ads yet</h3><p>Create your first ad to get started</p></div>';
        }
        updateCount();
        return;
      }
      
      allAds = ads;
      console.log('✅ Stored', allAds.length, 'ads in allAds array');
      console.log('📋 Sample ad data:', allAds[0] ? {
        id: allAds[0].id,
        title: allAds[0].title,
        hasImage: !!allAds[0].image_url,
        imageUrl: allAds[0].image_url,
        isActive: allAds[0].is_active
      } : 'No ads');
      
      // Apply current filter (which will call renderAdsDirectly)
      // This ensures the filter state is respected
      applyFilter();
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to load ads:', response.status, errorData);
      adsList.innerHTML = `
        <div class="empty-state">
          <h3>Error loading ads</h3>
          <p>${errorData.error || 'Please try refreshing the page'}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading ads:', error);
    adsList.innerHTML = `
      <div class="empty-state">
        <h3>Error loading ads</h3>
        <p>Network error. Please check your connection.</p>
      </div>
    `;
  }
}

function showSkeletonLoader() {
  // Ensure adsList is available
  if (!adsList) {
    adsList = document.getElementById('ads-list');
    if (!adsList) {
      console.error('adsList not found for skeleton loader');
      return;
    }
  }
  
  // Ensure container is visible
  const container = document.getElementById('ads-list-container');
  if (container) {
    container.classList.remove('hidden');
  }
  
  // Show 3 skeleton cards
  adsList.innerHTML = `
    <div class="ad-card skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div class="skeleton-meta">
          <div class="skeleton-badge"></div>
          <div class="skeleton-badge"></div>
          <div class="skeleton-line skeleton-meta-item"></div>
        </div>
      </div>
      <div class="skeleton-actions">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>
    <div class="ad-card skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div class="skeleton-meta">
          <div class="skeleton-badge"></div>
          <div class="skeleton-badge"></div>
          <div class="skeleton-line skeleton-meta-item"></div>
        </div>
      </div>
      <div class="skeleton-actions">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>
    <div class="ad-card skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div class="skeleton-meta">
          <div class="skeleton-badge"></div>
          <div class="skeleton-badge"></div>
          <div class="skeleton-line skeleton-meta-item"></div>
        </div>
      </div>
      <div class="skeleton-actions">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>
  `;
}

function setFilter(filter) {
  currentFilter = filter;
  
  // Update active button state
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  applyFilter();
}

function applyFilter() {
  if (!allAds || !Array.isArray(allAds) || allAds.length === 0) {
    renderAdsDirectly([]);
    updateCount();
    return;
  }
  
  let filteredAds = allAds;
  
  // Apply status filter
  if (currentFilter === 'active') {
    filteredAds = allAds.filter(ad => {
      const isActive = ad.is_active === true || ad.is_active === 1 || ad.is_active === 'true';
      return isActive;
    });
  } else if (currentFilter === 'inactive') {
    filteredAds = allAds.filter(ad => {
      const isActive = ad.is_active === true || ad.is_active === 1 || ad.is_active === 'true';
      return !isActive;
    });
  }
  
  // Apply search filter
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase();
    filteredAds = filteredAds.filter(ad => {
      const title = (ad.title || '').toLowerCase();
      const description = (ad.description || '').toLowerCase();
      const category = (ad.category || '').toLowerCase();
      const ctaUrl = (ad.cta_url || '').toLowerCase();
      
      return title.includes(query) || 
             description.includes(query) || 
             category.includes(query) ||
             ctaUrl.includes(query);
    });
  }
  
  renderAdsDirectly(filteredAds);
  updateCount();
}

// Handle search input with debounce
function handleSearch(e) {
  searchQuery = e.target.value;
  
  // Show/hide clear button
  if (clearSearchBtn) {
    clearSearchBtn.style.display = searchQuery.trim() ? 'flex' : 'none';
  }
  
  // Debounce search for better performance
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  searchDebounceTimer = setTimeout(() => {
    // Apply filter with search
    applyFilter();
  }, 300); // 300ms debounce
}

// Clear search
function clearSearch() {
  if (searchInput) {
    searchInput.value = '';
    searchQuery = '';
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.style.display = 'none';
  }
  
  // Reapply filter without search
  applyFilter();
}

function updateCount() {
  const totalCount = allAds.length;
  const activeCount = allAds.filter(ad => {
    const isActive = ad.is_active === true || ad.is_active === 1 || ad.is_active === 'true';
    return isActive;
  }).length;
  const inactiveCount = totalCount - activeCount;
  
  let countText = '';
  if (currentFilter === 'all') {
    countText = `${totalCount} ad${totalCount !== 1 ? 's' : ''} (${activeCount} active, ${inactiveCount} inactive)`;
  } else if (currentFilter === 'active') {
    countText = `${activeCount} active ad${activeCount !== 1 ? 's' : ''}`;
  } else {
    countText = `${inactiveCount} inactive ad${inactiveCount !== 1 ? 's' : ''}`;
  }
  
  adsCount.textContent = countText;
}

// Direct render function - improved with security and performance
function renderAdsDirectly(ads) {
  console.log('🎨 renderAdsDirectly called with', ads?.length || 0, 'ads');
  
  const el = document.getElementById('ads-list');
  if (!el) {
    console.error('❌ ads-list element not found!');
    return;
  }
  
  const container = document.getElementById('ads-list-container');
  if (container) {
    container.classList.remove('hidden');
    console.log('✅ ads-list-container is now visible');
  } else {
    console.warn('⚠️ ads-list-container not found');
  }
  
  if (!ads || ads.length === 0) {
    el.innerHTML = '<div class="empty-state"><h3>No ads yet</h3><p>Create your first ad</p></div>';
    return;
  }

  // Validate and sanitize ads array
  const validAds = ads.filter(ad => ad && typeof ad === 'object');
  console.log(`🔍 Processing ${validAds.length} valid ads out of ${ads.length} total`);
  
  if (validAds.length === 0) {
    console.warn('⚠️ No valid ads found after filtering');
    el.innerHTML = '<div class="empty-state"><h3>No valid ads found</h3><p>Please check your data</p></div>';
    return;
  }

  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  
  validAds.forEach(ad => {
    const isActive = ad.is_active === true || ad.is_active === 1;
    
    // Escape all user input to prevent XSS
    const title = escapeHtml(ad.title || 'Untitled');
    const description = escapeHtml(ad.description || 'No description');
    const category = escapeHtml(ad.category || 'uncategorized');
    const ctaUrl = validateUrl(ad.cta_url) || '#';
    const imageUrl = validateUrl(ad.image_url);
    
    // Debug logging for troubleshooting
    if (!imageUrl && ad.image_url) {
      console.warn('⚠️ Image URL rejected for ad:', ad.id, 'Original URL:', ad.image_url);
    }
    if (ctaUrl === '#' && ad.cta_url) {
      console.warn('⚠️ CTA URL rejected for ad:', ad.id, 'Original URL:', ad.cta_url);
    }
    
    // Create ad card element
    const adCard = document.createElement('div');
    adCard.className = 'ad-card';
    adCard.dataset.adId = ad.id; // Store ID for event delegation
    
    adCard.innerHTML = `
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${title}" class="ad-image" loading="lazy" onerror="this.style.display='none'">` : '<div class="ad-image"></div>'}
      <div class="ad-content">
        <h3 class="ad-title">${title}</h3>
        <p class="ad-description">${description}</p>
        <div class="ad-meta">
          <span class="ad-badge category">${category}</span>
          <span class="ad-badge ${isActive ? 'active' : 'inactive'}">${isActive ? 'Active' : 'Inactive'}</span>
          <span class="ad-meta-item">${ad.timeframe_days || 0} days</span>
          <span class="ad-meta-item">${ad.created_at ? formatDate(ad.created_at) : 'N/A'}</span>
        </div>
        <div class="cta-container">
          <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">View CTA URL</a>
        </div>
      </div>
      <div class="ad-actions">
        <button class="btn btn-toggle" data-action="toggle" data-ad-id="${ad.id}" data-new-status="${!isActive}">
          ${isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button class="btn btn-primary" data-action="edit" data-ad-id="${ad.id}">Edit</button>
        <button class="btn btn-secondary" data-action="delete" data-ad-id="${ad.id}">Delete</button>
      </div>
    `;
    
    fragment.appendChild(adCard);
  });
  
  // Clear and append all at once for better performance
  el.innerHTML = '';
  el.appendChild(fragment);
  
  // Verify the ads were actually added to the DOM
  const renderedCards = el.querySelectorAll('.ad-card');
  console.log(`✅ Rendered ${renderedCards.length} ad cards in DOM (expected ${validAds.length})`);
  
  if (renderedCards.length !== validAds.length) {
    console.error('❌ Mismatch: Expected', validAds.length, 'ads but found', renderedCards.length, 'in DOM');
  }
  
  // Event delegation is handled globally, no need to attach here
  // The click handler on document will catch events from dynamically added buttons
}

function displayAds(ads) {
  // Use the direct render function
  renderAdsDirectly(ads);
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
    // Handle boolean is_active (Supabase returns true/false)
    document.getElementById('ad-is-active').checked = ad.is_active === true || ad.is_active === 1 || ad.is_active === 'true';
    
    if (ad.image_url) {
      imagePreview.innerHTML = `<img src="${ad.image_url}" alt="Preview">`;
    }
  } else {
    formTitle.textContent = 'Create New Ad';
    adForm.reset();
    // Ensure ad-id is empty for new ads (Supabase will auto-generate)
    document.getElementById('ad-id').value = '';
    imagePreview.innerHTML = '';
  }
  
  adFormContainer.classList.remove('hidden');
  document.getElementById('ads-list-container').classList.add('hidden');
}

function hideAdForm() {
  adFormContainer.classList.add('hidden');
  document.getElementById('ads-list-container').classList.remove('hidden');
  adForm.reset();
  // Ensure ad-id is cleared (Supabase will auto-generate on create)
  document.getElementById('ad-id').value = '';
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
  const isEdit = !!adId && adId.trim() !== '';
  
  // For new ads, remove id from formData to let Supabase auto-generate it
  if (!isEdit) {
    formData.delete('id');
  }

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
  if (text === null || text === undefined) {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// Validate and sanitize URLs to prevent XSS and unsafe protocols
function validateUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Trim whitespace
  url = url.trim();
  if (!url) return null;
  
  // Check if it's already a valid absolute URL (http/https)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      // Only allow http, https protocols
      if (['http:', 'https:'].includes(urlObj.protocol)) {
        return urlObj.href;
      }
    } catch (e) {
      console.warn('Invalid absolute URL:', url, e);
      return null;
    }
  }
  
  // Check if it's a safe relative URL
  if (url.startsWith('/') || url.startsWith('./')) {
    return url;
  }
  
  // Try to construct URL with base (for relative URLs without leading slash)
  try {
    const urlObj = new URL(url, window.location.origin);
    if (['http:', 'https:'].includes(urlObj.protocol)) {
      return urlObj.href;
    }
  } catch (e) {
    // Not a valid URL
    console.warn('Invalid URL format:', url);
    return null;
  }
  
  return null;
}


function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

async function toggleAdStatus(id, newStatus) {
  try {
    // Find the ad in allAds
    const ad = allAds.find(a => a.id === id);
    if (!ad) {
      alert('Ad not found');
      return;
    }

    // Update the ad status
    const response = await fetch(`${API_BASE}/ads/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: ad.title,
        description: ad.description,
        cta_url: ad.cta_url,
        category: ad.category,
        timeframe_days: ad.timeframe_days,
        is_active: newStatus
      })
    });

    if (response.ok) {
      const updatedAd = await response.json();
      // Update the ad in allAds array
      const index = allAds.findIndex(a => a.id === id);
      if (index !== -1) {
        allAds[index] = updatedAd;
      }
      // Re-apply filter to refresh display
      applyFilter();
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to update ad status');
    }
  } catch (error) {
    console.error('Error toggling ad status:', error);
    alert('Network error. Please try again.');
  }
}

// Make functions available globally for onclick handlers
window.editAd = editAd;
window.deleteAd = deleteAd;
window.toggleAdStatus = toggleAdStatus;

