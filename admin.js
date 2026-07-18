// admin.js
// Production-Ready Shopify-style Admin Dashboard Controller
// Designed and implemented in pure Vanilla JS with modular Supabase client operations.

import { supabase } from './supabase.js';

// Global variables & state parameters
let currentTab = 'tab-overview';
let products = [];
let categories = [];
let brands = [];
let coupons = [];
let activities = [];
let inventoryLogs = [];
let auditLogs = [];
let instagramImages = [];

// Selection states for bulk execution
let selectedProductIds = new Set();

// Pagination State
let currentPage = 1;
const itemsPerPage = 8;
let totalProductsCount = 0;

// Current Active Edit Objects
let activeProduct = null;
let uploadedImages = []; // Array of URL strings or base64 data for sorting

// Active User Admin Info
let currentUserAdmin = null;
let sandboxBypassActive = false;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Sanwariya Watch Admin Workspace Initializing...');
  
  // Clear any remnant client-side mock bookings
  localStorage.removeItem('local_orders');

  // Bind standard Event Listeners
  setupAuthListeners();
  setupTabListeners();
  setupFilterListeners();
  setupBulkListeners();
  setupFormListeners();
  setupThemeToggler();

  // Bind bookings refresh button
  const btnRefreshBookings = document.getElementById('btn-refresh-bookings');
  if (btnRefreshBookings) {
    btnRefreshBookings.addEventListener('click', () => {
      fetchBookings();
    });
  }

  // Bind Instagram settings save button
  const btnSaveInstagram = document.getElementById('btn-save-instagram');
  if (btnSaveInstagram) {
    btnSaveInstagram.addEventListener('click', () => {
      saveInstagramSettings();
    });
  }

  // Try Auto-recovering Session
  await checkCurrentSession();
});

// ==========================================
// TOAST BANNER INJECTOR
// ==========================================
export function showToast(message, type = 'gold') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 pointer-events-auto transform translate-y-2 opacity-0 transition-all duration-300`;
  
  let colors = 'bg-slate-900/90 border-slate-800 text-slate-100';
  let indicator = '👑';
  
  if (type === 'success') {
    colors = 'bg-emerald-950/90 border-emerald-900/50 text-emerald-300';
    indicator = '🟢';
  } else if (type === 'error') {
    colors = 'bg-red-950/90 border-red-900/50 text-red-300';
    indicator = '🔴';
  } else if (type === 'warning') {
    colors = 'bg-amber-950/90 border-amber-900/50 text-amber-300';
    indicator = '⚠️';
  }

  toast.className += ` ${colors}`;
  toast.innerHTML = `
    <div class="flex items-center gap-2.5 text-xs">
      <span>${indicator}</span>
      <p class="font-medium">${message}</p>
    </div>
    <button class="text-[10px] text-slate-400 hover:text-white font-bold" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  // Trigger entering animation
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Auto-expire after 4 seconds
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}


// ==========================================
// SECURITY: SESSION MANAGEMENT & COMPLIANCE
// ==========================================
async function checkCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (session) {
      const user = session.user;
      
      // Check if user is registered in the public.admins role mapping
      const isAdmin = await verifyAdminPrivileges(user);
      
      if (isAdmin) {
        setSessionAuthenticated(user);
        await refreshAllData();
        hideOverlay();
      } else {
        // Sign out since they are not an admin, but show the admin login panel instead of redirecting
        showToast('Access Denied: Your profile is not mapped with Admin privileges.', 'error');
        await supabase.auth.signOut();
        showAuthScreen();
        showAuthAlert('Forbidden Profile. This account lacks administrative credentials in public.admins. Please sign in using an authorized account.', 'error');
        hideOverlay();
      }
    } else {
      // No active session: show the admin auth page instead of redirecting to login.html
      showAuthScreen();
      hideOverlay();
    }
  } catch (err) {
    console.error('Session recovery failed:', err);
    showAuthScreen();
    showAuthAlert('Session verification failed. Please try again.', 'error');
    hideOverlay();
  }
}

function hideOverlay() {
  const loadingOverlay = document.getElementById('auth-loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('opacity-0');
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
    }, 300);
  }
}

async function verifyAdminPrivileges(user) {
  if (!user) return false;
  try {
    // 1. Try checking by the primary uuid
    let { data, error } = await supabase
      .from('admins')
      .select('role, id, email')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      return true;
    }

    // 2. Fallback checking by email address (safely case-insensitive)
    if (user.email) {
      const emailLower = user.email.toLowerCase();
      const { data: emailData, error: emailError } = await supabase
        .from('admins')
        .select('role, id, email')
        .eq('email', emailLower)
        .maybeSingle();

      if (emailData) {
        console.log('Admin verified via email address fallback. Aligning mismatched database ID with Auth user ID...');
        // Correct the mismatched UUID in public.admins to match their actual authenticated user ID
        try {
          await supabase
            .from('admins')
            .update({ id: user.id })
            .eq('email', emailLower);
          showToast('Database entry aligned: Mapped UUID was synchronized successfully.', 'info');
        } catch (updateErr) {
          console.warn('Could not auto-align admin UUID in public.admins:', updateErr);
        }
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Error verifying admin privileges:', err);
    return false;
  }
}

function setSessionAuthenticated(user) {
  currentUserAdmin = user;
  
  // Hide Auth section, display dashboard
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');

  // Update profile indicators
  document.getElementById('admin-avatar-pill').textContent = (user.email || 'A')[0].toUpperCase();
  document.getElementById('admin-email-pill').textContent = user.email;

  showToast(`Authorized administrative crypt session recovered for ${user.email}.`, 'success');
  logActivity('Authenticated Session Recovered', { user: user.email });
}

function showAuthScreen() {
  document.getElementById('auth-section').classList.remove('hidden');
  document.getElementById('dashboard-section').classList.add('hidden');
  currentUserAdmin = null;
}


// ==========================================
// INTERACTIVE AUTH FORM LISTENERS & RESET
// ==========================================
function setupAuthListeners() {
  const loginForm = document.getElementById('admin-login-form');
  const forgotForm = document.getElementById('admin-forgot-form');
  const forgotBtn = document.getElementById('btn-forgot-mode');
  const backBtn = document.getElementById('btn-back-login');

  // Toggle Screen modes
  if (forgotBtn) {
    forgotBtn.addEventListener('click', () => {
      document.getElementById('screen-login').classList.add('hidden');
      document.getElementById('screen-forgot').classList.remove('hidden');
      hideAuthAlert();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('screen-forgot').classList.add('hidden');
      document.getElementById('screen-login').classList.remove('hidden');
      hideAuthAlert();
    });
  }

  // Admin Log-in submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value;

      const btnSubmit = document.getElementById('btn-admin-login');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Verifying Authenticity...';
      hideAuthAlert();

      try {
        // Sign In flow
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Verify Admin Table Record mapping
        const isAdmin = await verifyAdminPrivileges(data.user);
        
        if (isAdmin) {
          setSessionAuthenticated(data.user);
          await refreshAllData();
        } else {
          showToast('Forbidden Profile: Mapped administrator role required.', 'error');
          await supabase.auth.signOut();
          showAuthScreen();
          showAuthAlert('Forbidden Profile. This account lacks the administrative credentials inside public.admins.', 'error');
        }

      } catch (err) {
        console.error('Admin authentication failed:', err);
        showAuthAlert(err.message || 'Authentication operation failed.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Authenticate Credentials';
      }
    });
  }

  // Admin Forgot Password reset link
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      const btnSubmit = document.getElementById('btn-forgot-submit');
      
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Sending...';
      hideAuthAlert();

      try {
        const resetRedirectUrl = `${window.location.origin}/update-password.html`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetRedirectUrl
        });

        if (error) throw error;

        showAuthAlert('Recovery dispatch successfully triggered. Please monitor your inbox and open the update link.', 'success');
        showToast('Password recovery link dispatched to administrator email.', 'success');
      } catch (err) {
        showAuthAlert(err.message || 'Failed to dispatch password recovery.', 'error');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Send Recovery Email Link';
      }
    });
  }



  // Admin Logout button
  document.getElementById('btn-admin-logout').addEventListener('click', async () => {
    try {
      await supabase.auth.signOut();
      showToast('SSL Secure Admin Crypt closed. Mapped credentials de-authorized.', 'warning');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1000);
    } catch (err) {
      showToast('Error logging out of administrative session.', 'error');
    }
  });
}

function showAuthAlert(message, type) {
  const container = document.getElementById('auth-alert');
  const icon = document.getElementById('auth-alert-icon');
  const text = document.getElementById('auth-alert-text');

  text.textContent = message;
  container.className = "mb-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ";
  
  if (type === 'success') {
    icon.textContent = '🟢';
    container.className += "border border-green-500/20 bg-green-500/10 text-green-400";
  } else {
    icon.textContent = '⚠️';
    container.className += "border border-red-500/20 bg-red-500/10 text-red-400";
  }
  container.classList.remove('hidden');
}

function hideAuthAlert() {
  document.getElementById('auth-alert').classList.add('hidden');
}


// ==========================================
// WORKSPACE NAVIGATION: TAB SWITCHES
// ==========================================
function setupTabListeners() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchTab(target);
    });
  });
}

export function switchTab(tabId) {
  currentTab = tabId;
  
  // Update nav UI active styles
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('bg-slate-900', 'border-slate-800/80', 'text-gold-500');
      btn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-900/60');
    } else {
      btn.classList.remove('bg-slate-900', 'border-slate-800/80', 'text-gold-500');
      btn.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-900/60');
    }
  });

  // Hide all panels, show target
  const panels = document.querySelectorAll('.tab-panel');
  panels.forEach(p => p.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');

  // Set Breadcrumbs and update
  const textLabels = {
    'tab-overview': 'Dashboard Overview',
    'tab-products': 'Product Catalog',
    'tab-categories': 'Categories & Brands',
    'tab-discounts': 'Discounts & Coupons',
    'tab-bookings': 'Customer Bookings',
    'tab-stock': 'Stock & Warehouse Logs',
    'tab-logs': 'Admin Activity Audit',
    'tab-admins': 'Admin Roles',
    'tab-instagram': 'Instagram Drops'
  };
  document.getElementById('breadcrumb-current').textContent = textLabels[tabId] || 'Workspace';

  // Specific tab callbacks to pull latest states
  if (tabId === 'tab-products') {
    fetchProducts();
  } else if (tabId === 'tab-categories') {
    fetchCategoriesAndBrands();
  } else if (tabId === 'tab-discounts') {
    fetchCoupons();
  } else if (tabId === 'tab-bookings') {
    fetchBookings();
  } else if (tabId === 'tab-stock') {
    fetchProductsForQuickStock();
    fetchInventoryLogs();
  } else if (tabId === 'tab-logs') {
    fetchAuditActivityLogs();
  } else if (tabId === 'tab-admins') {
    fetchAdminRoles();
  } else if (tabId === 'tab-instagram') {
    fetchInstagramSettings();
  }
}
window.switchTab = switchTab; // Expose globally for HTML onclicks


// ==========================================
// REFRESH ALL DATABASE METRICS & KPI AUDITS
// ==========================================
async function refreshAllData() {
  try {
    await fetchCategoriesAndBrands();
    await fetchDashboardMetrics();
  } catch (err) {
    console.error('Error executing database metrics refreshing:', err);
  }
}

async function fetchDashboardMetrics() {
  try {
    // 1. Fetch total counts
    const { data: prods, error: pErr } = await supabase
      .from('products')
      .select('pricing_selling, status, stock_status, stock_quantity, category_id');

    if (pErr) throw pErr;

    const totalCount = prods.length;
    const activeCount = prods.filter(p => p.status === 'published').length;
    const outStockCount = prods.filter(p => p.stock_status === 'out_of_stock' || p.stock_quantity <= 0).length;
    const lowStockProds = prods.filter(p => p.stock_status === 'low_stock' && p.stock_quantity > 0);

    // 2. Fetch bookings / orders metrics
    let bookingsList = [];
    try {
      let { data, error } = await supabase.from('bookings').select('total_price, status, phone');
      if (error) {
        let fallback = await supabase.from('orders').select('total_price, status, phone');
        if (!fallback.error) {
          bookingsList = fallback.data || [];
        } else {
          bookingsList = [];
        }
      } else {
        bookingsList = data || [];
      }
    } catch (bErr) {
      console.warn('Could not query bookings/orders for metrics calculation:', bErr);
      bookingsList = [];
    }

    const totalOrders = bookingsList.length;
    
    // Revenue is the sum of total_price of bookings that have status === 'Approved'
    const approvedRevenue = bookingsList
      .filter(b => b.status === 'Approved')
      .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

    // Unique customers based on phone number
    const uniquePhones = new Set(bookingsList.map(b => b.phone).filter(Boolean));
    const totalCustomers = uniquePhones.size || bookingsList.length;

    // Update KPIs UI
    document.getElementById('stat-total-products').textContent = totalCount;
    document.getElementById('stat-active-products').textContent = activeCount;
    document.getElementById('stat-out-stock').textContent = outStockCount;
    document.getElementById('stat-total-orders').textContent = totalOrders;
    document.getElementById('stat-revenue').textContent = `₹${approvedRevenue.toLocaleString('en-IN')}`;
    document.getElementById('stat-total-customers').textContent = totalCustomers;

    // 2. Render Custom SVG Distribution bar charts
    renderSVGCategoryChart(prods);

    // 3. Render Low Stock alert sidebar
    renderLowStockAlerts(lowStockProds);

    // 4. Render logs summary
    renderSessionActivities();

  } catch (err) {
    console.error('Failed to compute dashboard aggregations:', err);
    showToast('Failed to retrieve full dashboard sales stats.', 'error');
  }
}

function renderSVGCategoryChart(prods) {
  const chartContainer = document.getElementById('inventory-chart-bars');
  if (!chartContainer) return;

  // Group stock count by Category ID
  const distribution = {};
  prods.forEach(p => {
    const catName = getCategoryName(p.category_id);
    distribution[catName] = (distribution[catName] || 0) + Number(p.stock_quantity || 0);
  });

  const categoriesKeys = Object.keys(distribution);
  if (categoriesKeys.length === 0) {
    chartContainer.innerHTML = `<p class="text-xs text-slate-500 italic py-20 text-center w-full">Empty catalog distribution database.</p>`;
    return;
  }

  const maxVal = Math.max(...Object.values(distribution), 10);
  chartContainer.innerHTML = '';

  categoriesKeys.forEach(catKey => {
    const value = distribution[catKey];
    const percentage = (value / maxVal) * 100;
    
    const col = document.createElement('div');
    col.className = "flex-1 flex flex-col items-center gap-2 group h-full justify-end";
    col.innerHTML = `
      <span class="text-[10px] font-mono font-bold text-gold-400 group-hover:scale-110 transition-transform">Qty: ${value}</span>
      <div class="w-10 bg-slate-800 border border-slate-750 rounded-lg group-hover:border-gold-500/50 group-hover:bg-slate-850 transition-all flex items-end overflow-hidden" style="height: ${percentage}%;">
        <div class="w-full bg-gradient-to-t from-gold-600 to-gold-400 h-full origin-bottom transform scale-y-100 group-hover:brightness-110 transition-all"></div>
      </div>
      <p class="text-[9px] font-mono text-slate-400 truncate w-20 text-center mt-1 uppercase" title="${catKey}">${catKey}</p>
    `;
    chartContainer.appendChild(col);
  });
}

function renderLowStockAlerts(lowProds) {
  const container = document.getElementById('low-stock-alert-list');
  if (!container) return;

  if (lowProds.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic py-6 text-center">Warehouse levels healthy. No urgent low stock alarms.</p>`;
    return;
  }

  container.innerHTML = '';
  // Resolve product names
  // Fetch names separately or query inline
  lowProds.slice(0, 4).forEach(lp => {
    // Let's find full details locally if matches
    const item = products.find(p => p.id === lp.id) || { name: 'Exclusive Luxury Watch' };
    const alertRow = document.createElement('div');
    alertRow.className = "p-3 rounded-xl border border-amber-900/30 bg-amber-500/5 flex justify-between items-center";
    alertRow.innerHTML = `
      <div>
        <p class="text-xs font-bold text-white leading-tight truncate w-36">${item.name || 'Chronometer'}</p>
        <p class="text-[9px] font-mono text-amber-500 mt-0.5">WARNING: LEVEL DEPRECIATING</p>
      </div>
      <span class="text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-lg">
        ${lp.stock_quantity} left
      </span>
    `;
    container.appendChild(alertRow);
  });
}


// ==========================================
// AUDIT LOG SYSTEM (ROW LEVEL AUDITING)
// ==========================================
function logActivity(action, details = {}) {
  const userStr = currentUserAdmin ? currentUserAdmin.email : 'System Sandbox';
  const newLog = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    user: userStr,
    action: action,
    details: details
  };

  activities.unshift(newLog);
  if (activities.length > 20) activities.pop();

  // Try appending to Supabase activity_logs table if accessible
  try {
    supabase.from('activity_logs').insert({
      action: action,
      details: details,
      ip_address: '127.0.0.1'
    }).then(({ error }) => {
      if (error) console.warn('Activity Logging RLS Warning:', error.message);
    });
  } catch (err) {
    // local fallback graceful
  }

  renderSessionActivities();
}

function renderSessionActivities() {
  const container = document.getElementById('recent-activities-list');
  if (!container) return;

  if (activities.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-6 text-center">No operations audited in current session.</p>`;
    return;
  }

  container.innerHTML = '';
  activities.slice(0, 5).forEach(act => {
    const row = document.createElement('div');
    row.className = "py-3 flex justify-between items-center text-xs";
    row.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="text-gold-500 text-sm">⚡</span>
        <div>
          <p class="text-white font-semibold leading-tight">${act.action}</p>
          <p class="text-[9px] font-mono text-slate-500">${act.user} • ${act.timestamp}</p>
        </div>
      </div>
      <span class="text-[10px] font-mono text-slate-400 bg-slate-950 py-0.5 px-2 rounded border border-slate-900 truncate max-w-[150px]">
        ${JSON.stringify(act.details)}
      </span>
    `;
    container.appendChild(row);
  });
}


// ==========================================
// DYNAMIC PRODUCTS FETCHING & BINDING
// ==========================================
async function fetchProducts() {
  const tableBody = document.getElementById('products-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr class="skeleton-loader text-slate-500">
      <td colspan="8" class="p-8 text-center text-xs font-mono">Querying secure cloud database tables...</td>
    </tr>
  `;

  try {
    // Pull full query
    let query = supabase
      .from('products')
      .select('*, product_images(image_url, sort_order)', { count: 'exact' });

    // Apply Filter Parameters
    const searchVal = document.getElementById('filter-search').value.trim().toLowerCase();
    if (searchVal) {
      query = query.or(`name.ilike.%${searchVal}%,sku.ilike.%${searchVal}%,seo_keywords.ilike.%${searchVal}%`);
    }

    const catFilter = document.getElementById('filter-category').value;
    if (catFilter && catFilter !== 'all') {
      query = query.eq('category_id', catFilter);
    }

    const brandFilter = document.getElementById('filter-brand').value;
    if (brandFilter && brandFilter !== 'all') {
      query = query.eq('brand_id', brandFilter);
    }

    const stockFilter = document.getElementById('filter-stock').value;
    if (stockFilter && stockFilter !== 'all') {
      query = query.eq('stock_status', stockFilter);
    }

    // Apply Sorting Parameters
    const sortVal = document.getElementById('filter-sort').value;
    if (sortVal === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortVal === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sortVal === 'price_low') {
      query = query.order('pricing_selling', { ascending: true });
    } else if (sortVal === 'price_high') {
      query = query.order('pricing_selling', { ascending: false });
    } else if (sortVal === 'stock_low') {
      query = query.order('stock_quantity', { ascending: true });
    } else if (sortVal === 'name_asc') {
      query = query.order('name', { ascending: true });
    }

    // Pagination slice
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    products = (data || []).map(p => {
      return {
        ...p,
        images: p.product_images ? p.product_images.sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)).map(img => img.image_url) : []
      };
    });
    totalProductsCount = count || 0;

    // Render table rows
    renderProductsTable();
    updatePaginationUI();

  } catch (err) {
    console.error('Error fetching chronometer database:', err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="p-8 text-center text-xs text-red-400">
          ⚠️ Could not fetch products. Check storage/database migrations. Error: ${err.message}
        </td>
      </tr>
    `;
  }
}

function renderProductsTable() {
  const tableBody = document.getElementById('products-table-body');
  if (!tableBody) return;

  if (products.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="p-12 text-center text-slate-500 italic">
          <span class="text-xl">📭</span>
          <p class="mt-2 text-xs">No watches found matching search filters. Create one!</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';
  products.forEach(p => {
    const isSelected = selectedProductIds.has(p.id);
    const catName = getCategoryName(p.category_id);
    const brandName = getBrandName(p.brand_id);
    
    // Resolve pricing references
    const originalPrice = Number(p.pricing_original || 0);
    const sellingPrice = Number(p.pricing_selling || 0);
    const discountPct = p.pricing_discount_percentage ? Number(p.pricing_discount_percentage).toFixed(0) : '0';
    
    // Image selection resolving helper
    let imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=120';
    if (p.images && p.images.length > 0) {
      imageUrl = p.images[0];
    } else if (p.image_url) {
      imageUrl = p.image_url;
    }

    // Status badges styling
    let statusBadge = '<span class="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[9px] uppercase tracking-wide">Draft</span>';
    if (p.status === 'published') {
      statusBadge = '<span class="px-2 py-1 rounded bg-emerald-950 text-emerald-400 text-[9px] uppercase tracking-wide font-bold">Published</span>';
    } else if (p.status === 'hidden') {
      statusBadge = '<span class="px-2 py-1 rounded bg-amber-950 text-amber-400 text-[9px] uppercase tracking-wide">Hidden</span>';
    }

    // Stock level badges
    let stockBadge = `<span class="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">${p.stock_quantity} pcs</span>`;
    if (p.unlimited_stock) {
      stockBadge = `<span class="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono">∞ Unlimited</span>`;
    } else if (p.stock_quantity <= 0) {
      stockBadge = `<span class="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-mono font-bold">OUT OF STOCK</span>`;
    } else if (p.stock_quantity <= p.low_stock_warning) {
      stockBadge = `<span class="px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">Low (${p.stock_quantity})</span>`;
    }

    const row = document.createElement('tr');
    row.className = `hover:bg-slate-900/40 transition-colors border-b border-slate-850 ${isSelected ? 'bg-gold-500/5' : ''}`;
    row.innerHTML = `
      <td class="p-4"><input type="checkbox" data-id="${p.id}" class="check-product rounded border-slate-800 cursor-pointer accent-gold-500" ${isSelected ? 'checked' : ''} /></td>
      
      <!-- Watch Detail Info -->
      <td class="p-4">
        <div class="flex items-center gap-3">
          <img src="${imageUrl}" class="h-10 w-10 object-cover rounded-lg border border-slate-800" referrerPolicy="no-referrer" />
          <div class="min-w-0">
            <p class="font-bold text-white leading-tight truncate w-44 hover:underline cursor-pointer" onclick="openProductModal('${p.id}')">${p.name}</p>
            <p class="text-[9px] font-mono text-slate-500 mt-0.5 truncate w-40">${brandName || 'Independent House'}</p>
          </div>
        </div>
      </td>

      <td class="p-4 font-mono text-slate-400">${p.sku || 'N/A'}</td>
      <td class="p-4"><span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-300 uppercase text-[10px] font-mono">${catName}</span></td>
      
      <!-- Pricing matrix -->
      <td class="p-4 font-mono">
        <div class="text-white font-bold">₹${sellingPrice.toLocaleString('en-IN')}</div>
        ${originalPrice > sellingPrice ? `<div class="text-[10px] text-slate-500 line-through">₹${originalPrice.toLocaleString('en-IN')}</div>` : ''}
        ${Number(discountPct) > 0 ? `<span class="text-[9px] text-emerald-400 font-bold font-sans">${discountPct}% OFF</span>` : ''}
      </td>

      <td class="p-4 text-center">${stockBadge}</td>
      <td class="p-4 text-center">${statusBadge}</td>

      <!-- Action buttons -->
      <td class="p-4 text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button onclick="duplicateProduct('${p.id}')" class="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-gold-500 transition-colors" title="Duplicate watch specs">📋</button>
          <button onclick="openProductModal('${p.id}')" class="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Edit specifications">✏️</button>
          <button onclick="promptDeleteProduct('${p.id}')" class="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors" title="Purge database entry">🗑️</button>
        </div>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Re-bind row checkbox triggers
  const checkboxes = tableBody.querySelectorAll('.check-product');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = cb.getAttribute('data-id');
      if (e.target.checked) {
        selectedProductIds.add(id);
      } else {
        selectedProductIds.delete(id);
      }
      updateBulkActionsBar();
    });
  });
}

function updatePaginationUI() {
  const indicator = document.getElementById('page-indicator');
  const prevBtn = document.getElementById('btn-prev-page');
  const nextBtn = document.getElementById('btn-next-page');
  const statusSpan = document.getElementById('pagination-status');

  if (indicator) indicator.textContent = currentPage;

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(from + itemsPerPage - 1, totalProductsCount);

  if (statusSpan) {
    statusSpan.textContent = totalProductsCount > 0 
      ? `Showing ${from} to ${to} of ${totalProductsCount} Watches`
      : 'Showing 0 to 0 of 0 Watches';
  }

  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = to >= totalProductsCount;
}

function setupFilterListeners() {
  document.getElementById('filter-search').addEventListener('input', () => {
    currentPage = 1;
    fetchProducts();
  });
  document.getElementById('filter-category').addEventListener('change', () => {
    currentPage = 1;
    fetchProducts();
  });
  document.getElementById('filter-brand').addEventListener('change', () => {
    currentPage = 1;
    fetchProducts();
  });
  document.getElementById('filter-stock').addEventListener('change', () => {
    currentPage = 1;
    fetchProducts();
  });
  document.getElementById('filter-sort').addEventListener('change', () => {
    currentPage = 1;
    fetchProducts();
  });

  // Paginations button clicks
  document.getElementById('btn-prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchProducts();
    }
  });
  document.getElementById('btn-next-page').addEventListener('click', () => {
    currentPage++;
    fetchProducts();
  });
}


// ==========================================
// BULK MUTATION ACTIONS
// ==========================================
function setupBulkListeners() {
  const checkAll = document.getElementById('check-all-products');
  if (checkAll) {
    checkAll.addEventListener('change', (e) => {
      if (e.target.checked) {
        products.forEach(p => selectedProductIds.add(p.id));
      } else {
        products.forEach(p => selectedProductIds.delete(p.id));
      }
      renderProductsTable();
      updateBulkActionsBar();
    });
  }
}

function updateBulkActionsBar() {
  const bar = document.getElementById('bulk-actions-bar');
  const countSpan = document.getElementById('bulk-selection-count');
  
  if (selectedProductIds.size > 0) {
    bar.classList.remove('hidden');
    countSpan.textContent = `${selectedProductIds.size} watches selected for execution`;
  } else {
    bar.classList.add('hidden');
    const checkAll = document.getElementById('check-all-products');
    if (checkAll) checkAll.checked = false;
  }
}

async function executeBulkAction(action) {
  const ids = Array.from(selectedProductIds);
  if (ids.length === 0) return;

  showToast(`Initiating bulk ${action} operation...`, 'warning');
  logActivity(`Bulk Action Triggers`, { action, count: ids.length });

  try {
    if (action === 'publish') {
      const { error } = await supabase.from('products').update({ status: 'published' }).in('id', ids);
      if (error) throw error;
      showToast(`Successfully published ${ids.length} products to live catalogs.`, 'success');
    } else if (action === 'hide') {
      const { error } = await supabase.from('products').update({ status: 'hidden' }).in('id', ids);
      if (error) throw error;
      showToast(`Successfully hid ${ids.length} products from customer visibility.`, 'success');
    } else if (action === 'stock') {
      const { error } = await supabase.from('products').update({ stock_quantity: 99 }).in('id', ids);
      if (error) throw error;
      showToast(`Reset stock levels to 99 on ${ids.length} watches.`, 'success');
    } else if (action === 'delete') {
      // Trigger confirmation dialog
      openConfirmModal(`Confirm Bulk Deletion`, `Are you absolutely certain you wish to purge all ${ids.length} selected database records?`, async () => {
        const { error } = await supabase.from('products').delete().in('id', ids);
        if (error) throw error;
        showToast(`Successfully de-registered ${ids.length} items from database schemas.`, 'success');
        selectedProductIds.clear();
        updateBulkActionsBar();
        fetchProducts();
        refreshAllData();
      });
      return;
    }

    selectedProductIds.clear();
    updateBulkActionsBar();
    fetchProducts();
    refreshAllData();

  } catch (err) {
    console.error('Bulk mutation failed:', err);
    showToast(`Bulk operation failed: ${err.message}`, 'error');
  }
}
window.executeBulkAction = executeBulkAction;


// ==========================================
// SINGLE CRUD: PRODUCT DUPLICATION & CLONE
// ==========================================
async function duplicateProduct(id) {
  try {
    const { data: item, error: getErr } = await supabase
      .from('products')
      .select('*, product_images(image_url, sort_order)')
      .eq('id', id)
      .single();

    if (getErr) throw getErr;

    // Create shallow copy with modified identifiers and valid schema columns
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const clonedObj = {
      name: `${item.name} (Copy)`,
      slug: `${item.slug}-copy-${randomSuffix}`,
      sku: item.sku ? `${item.sku}-CP${randomSuffix}` : `CP-${randomSuffix}`,
      category_id: item.category_id,
      brand_id: item.brand_id,
      barcode: item.barcode,
      short_description: item.short_description,
      full_description: item.full_description,
      status: 'draft', // defaults to draft
      is_featured: item.is_featured,
      is_trending: item.is_trending,
      is_best_seller: item.is_best_seller,
      pricing_original: item.pricing_original,
      pricing_selling: item.pricing_selling,
      pricing_tax: item.pricing_tax,
      pricing_shipping: item.pricing_shipping,
      variant_size: item.variant_size,
      variant_color: item.variant_color,
      variant_weight: item.variant_weight,
      variant_dimensions: item.variant_dimensions,
      variant_material: item.variant_material,
      seo_title: item.seo_title,
      seo_description: item.seo_description,
      seo_keywords: item.seo_keywords,
      tags: item.tags
    };

    const { data: insertedData, error: insErr } = await supabase
      .from('products')
      .insert(clonedObj)
      .select('id')
      .single();

    if (insErr) throw insErr;

    // Duplicate product images if they exist
    if (insertedData && item.product_images && item.product_images.length > 0) {
      const imagePayloads = item.product_images.map(img => ({
        product_id: insertedData.id,
        image_url: img.image_url,
        sort_order: img.sort_order
      }));
      await supabase.from('product_images').insert(imagePayloads);
    }

    showToast(`Successfully duplicated watch: "${item.name}".`, 'success');
    logActivity('Duplicated Product Row', { source_id: id, name: clonedObj.name });
    fetchProducts();
    refreshAllData();

  } catch (err) {
    console.error('Failed to duplicate product record:', err);
    showToast(`Duplication failed: ${err.message}`, 'error');
  }
}
window.duplicateProduct = duplicateProduct;


// ==========================================
// ADD / EDIT DRAWER FORM LOGIC
// ==========================================
function setupFormListeners() {
  const pForm = document.getElementById('product-form');
  const originalInput = document.getElementById('p-price-original');
  const sellingInput = document.getElementById('p-price-selling');
  
  // Dynamic pricing calculation helper
  if (originalInput && sellingInput) {
    const calcFn = () => {
      const orig = Number(originalInput.value || 0);
      const sell = Number(sellingInput.value || 0);

      const discountAmt = Math.max(orig - sell, 0);
      const discountPct = orig > 0 ? (discountAmt / orig) * 100 : 0;

      document.getElementById('calc-discount-amt').textContent = `₹${discountAmt.toLocaleString('en-IN')}`;
      document.getElementById('calc-discount-pct').textContent = `${discountPct.toFixed(1)}%`;

      const profitText = document.getElementById('calc-profit-status');
      if (sell > orig) {
        profitText.textContent = 'Premium Gain';
        profitText.className = 'text-xs font-semibold text-emerald-400 mt-1';
      } else if (sell < orig && discountPct > 50) {
        profitText.textContent = 'High Discount!';
        profitText.className = 'text-xs font-semibold text-amber-500 mt-1';
      } else {
        profitText.textContent = 'Standard Margin';
        profitText.className = 'text-xs font-semibold text-slate-400 mt-1';
      }
    };
    originalInput.addEventListener('input', calcFn);
    sellingInput.addEventListener('input', calcFn);
  }

  // Handle Drag & Drop Multiple Product Images Upload
  const dragBox = document.getElementById('image-drag-drop');
  const fileInput = document.getElementById('p-image-upload-input');

  if (dragBox && fileInput) {
    dragBox.addEventListener('click', () => fileInput.click());
    
    // Prevent defaults on drag triggers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dragBox.addEventListener(eventName, (e) => e.preventDefault(), false);
    });

    dragBox.addEventListener('dragover', () => dragBox.classList.add('border-gold-500', 'bg-gold-500/5'));
    dragBox.addEventListener('dragleave', () => dragBox.classList.remove('border-gold-500', 'bg-gold-500/5'));
    dragBox.addEventListener('drop', (e) => {
      dragBox.classList.remove('border-gold-500', 'bg-gold-500/5');
      const files = e.dataTransfer.files;
      handleImageFilesUpload(files);
    });

    fileInput.addEventListener('change', (e) => {
      handleImageFilesUpload(e.target.files);
    });
  }

  // Form Submitting
  if (pForm) {
    pForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('btn-save-product');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving Specs into Cloud...';

      // Assemble Data Payload
      const id = document.getElementById('product-form-id').value;
      
      // Extract custom image array compiled
      let finalImages = [];
      const manualUrlsText = document.getElementById('p-image-urls').value.trim();
      if (manualUrlsText) {
        finalImages = manualUrlsText.split('\n').map(u => u.trim()).filter(u => u.length > 0);
      }
      // Combine with uploaded image base64 arrays or asset strings
      uploadedImages.forEach(img => {
        if (!finalImages.includes(img)) finalImages.push(img);
      });

      // Split comma separated tags
      const tagsText = document.getElementById('p-tags').value.trim();
      const tagsArray = tagsText ? tagsText.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];

      const payload = {
        name: document.getElementById('p-name').value.trim(),
        slug: document.getElementById('p-slug').value.trim(),
        category_id: document.getElementById('p-category').value || null,
        brand_id: document.getElementById('p-brand').value || null,
        sku: document.getElementById('p-sku').value.trim() || null,
        barcode: document.getElementById('p-barcode').value.trim() || null,
        stock_quantity: parseInt(document.getElementById('p-stock').value || 0),
        low_stock_warning: parseInt(document.getElementById('p-low-stock-warning').value || 3),
        unlimited_stock: document.getElementById('p-unlimited-stock').checked,
        short_description: document.getElementById('p-short-desc').value.trim() || null,
        full_description: document.getElementById('p-full-desc').value.trim() || null,
        
        status: document.getElementById('p-status').value,
        is_featured: document.getElementById('p-is-featured').checked,
        is_trending: document.getElementById('p-is-trending').checked,
        is_best_seller: document.getElementById('p-is-best-seller').checked,
        
        pricing_original: parseFloat(document.getElementById('p-price-original').value || 0),
        pricing_selling: parseFloat(document.getElementById('p-price-selling').value || 0),
        pricing_tax: parseFloat(document.getElementById('p-price-tax').value || 18),
        pricing_shipping: parseFloat(document.getElementById('p-price-shipping').value || 0),
        
        variant_size: document.getElementById('p-var-size').value.trim() || null,
        variant_color: document.getElementById('p-var-color').value.trim() || null,
        variant_weight: document.getElementById('p-var-weight').value.trim() || null,
        variant_dimensions: document.getElementById('p-var-dims').value.trim() || null,
        variant_material: document.getElementById('p-var-material').value.trim() || null,
        
        seo_title: document.getElementById('p-seo-title').value.trim() || null,
        seo_description: document.getElementById('p-seo-desc').value.trim() || null,
        seo_keywords: document.getElementById('p-seo-keywords').value.trim() || null,
        
        tags: tagsArray
      };

      try {
        let responseError = null;
        let savedProductId = id;

        if (id) {
          // Update
          const { error } = await supabase.from('products').update(payload).eq('id', id);
          responseError = error;
          logActivity('Update Product Specs', { id, name: payload.name });
        } else {
          // Create
          const { data, error } = await supabase.from('products').insert(payload).select('id').single();
          responseError = error;
          if (data) {
            savedProductId = data.id;
          }
          logActivity('Create New Product', { name: payload.name });
        }

        if (responseError) throw responseError;

        // Save images into product_images table
        if (savedProductId) {
          // 1. Delete existing images
          await supabase.from('product_images').delete().eq('product_id', savedProductId);

          // 2. Insert new images
          if (finalImages && finalImages.length > 0) {
            const imagePayloads = finalImages.map((img, index) => ({
              product_id: savedProductId,
              image_url: img,
              sort_order: index
            }));
            const { error: imgError } = await supabase.from('product_images').insert(imagePayloads);
            if (imgError) {
              console.warn('Error inserting product images:', imgError.message);
            }
          }
        }

        showToast(`Successfully saved luxury timepiece: "${payload.name}"!`, 'success');
        closeProductModal();
        fetchProducts();
        refreshAllData();

      } catch (err) {
        console.error('Error saving product:', err);
        showToast(`Failed to register watch: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Chronometer Changes';
      }
    });
  }

  // Bind forms for Categories & Brands too
  const catForm = document.getElementById('category-form');
  if (catForm) {
    catForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('category-form-id').value;
      const payload = {
        name: document.getElementById('cat-name').value.trim(),
        image_url: document.getElementById('cat-image').value.trim() || null,
        description: document.getElementById('cat-desc').value.trim() || null,
      };

      try {
        let error = null;
        if (id) {
          const res = await supabase.from('categories').update(payload).eq('id', id);
          error = res.error;
        } else {
          const res = await supabase.from('categories').insert(payload);
          error = res.error;
        }

        if (error) throw error;
        showToast('Watch Category successfully saved!', 'success');
        closeCategoryModal();
        fetchCategoriesAndBrands();
        logActivity('Save Category', { name: payload.name });
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  const brForm = document.getElementById('brand-form');
  if (brForm) {
    brForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('brand-form-id').value;
      const payload = {
        name: document.getElementById('br-name').value.trim(),
        logo_url: document.getElementById('br-logo').value.trim() || null,
        description: document.getElementById('br-desc').value.trim() || null,
      };

      try {
        let error = null;
        if (id) {
          const res = await supabase.from('brands').update(payload).eq('id', id);
          error = res.error;
        } else {
          const res = await supabase.from('brands').insert(payload);
          error = res.error;
        }

        if (error) throw error;
        showToast('Brand House successfully registered!', 'success');
        closeBrandModal();
        fetchCategoriesAndBrands();
        logActivity('Save Brand House', { name: payload.name });
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Coupons Form
  const coupForm = document.getElementById('coupon-form');
  if (coupForm) {
    coupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        code: document.getElementById('coup-code').value.trim().toUpperCase(),
        discount_type: document.getElementById('coup-type').value,
        discount_value: parseFloat(document.getElementById('coup-value').value || 0),
        start_date: document.getElementById('coup-start').value || null,
        end_date: document.getElementById('coup-end').value || null,
        is_active: document.getElementById('coup-active').checked
      };

      try {
        const { error } = await supabase.from('discounts').insert(payload);
        if (error) throw error;

        showToast(`Promo Code ${payload.code} successfully generated!`, 'success');
        closeCouponModal();
        fetchCoupons();
        logActivity('Issued Promo Code', { code: payload.code, value: payload.discount_value });
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Admin Roles form and refresh listeners
  const addAdminForm = document.getElementById('add-admin-form');
  if (addAdminForm) {
    addAdminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const uuid = document.getElementById('new-admin-uuid').value.trim();
      const email = document.getElementById('new-admin-email').value.trim();
      const role = document.getElementById('new-admin-role').value;

      if (!uuid || !email) {
        showToast('UUID and Email are required.', 'error');
        return;
      }

      try {
        const { error } = await supabase.from('admins').insert({
          id: uuid,
          email: email,
          role: role
        });

        if (error) throw error;

        showToast(`Successfully elevated ${email} to admin!`, 'success');
        document.getElementById('add-admin-form').reset();
        fetchAdminRoles();
        logActivity('Elevate User Admin', { email, role });
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  const btnRefreshAdmins = document.getElementById('btn-refresh-admins');
  if (btnRefreshAdmins) {
    btnRefreshAdmins.addEventListener('click', () => {
      fetchAdminRoles();
    });
  }

  // Category image upload file listener
  const catImageFile = document.getElementById('cat-image-file');
  if (catImageFile) {
    catImageFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const publicUrl = await uploadSingleFile(file, 'categories');
        if (publicUrl) {
          document.getElementById('cat-image').value = publicUrl;
          showToast('Category image file successfully processed!', 'success');
        }
      }
    });
  }

  // Brand logo upload file listener
  const brLogoFile = document.getElementById('br-logo-file');
  if (brLogoFile) {
    brLogoFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const publicUrl = await uploadSingleFile(file, 'brands');
        if (publicUrl) {
          document.getElementById('br-logo').value = publicUrl;
          showToast('Brand logo file successfully processed!', 'success');
        }
      }
    });
  }
}

// ENSURE STORAGE BUCKET EXISTS IN SUPABASE (Public access, auto-setup)
async function ensureStorageBucketExists(bucketName = 'product-images') {
  try {
    const { data: buckets, error: getError } = await supabase.storage.listBuckets();
    if (getError) {
      console.warn('Could not list buckets:', getError.message);
      return;
    }
    const exists = buckets && buckets.some(b => b.name === bucketName);
    if (!exists) {
      console.log(`Bucket "${bucketName}" not found. Attempting creation...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
      });
      if (createError) {
        console.warn(`Could not create bucket "${bucketName}" programmatically:`, createError.message);
      } else {
        console.log(`Bucket "${bucketName}" successfully created.`);
      }
    }
  } catch (err) {
    console.warn('Bucket ensuring failed (non-blocking):', err);
  }
}

// UPLOAD SINGLE FILE TO STORAGE BUCKET
async function uploadSingleFile(file, folder) {
  try {
    showToast(`Processing & uploading file to ${folder}...`, 'warning');
    const compressedBase64 = await compressImageCanvas(file, 800, 800, 0.75);
    
    // Auto ensure bucket exists
    await ensureStorageBucketExists('product-images');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const response = await fetch(compressedBase64);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, blob, { contentType: file.type, cacheControl: '3600' });

    if (error) {
      console.warn('Storage upload error, using base64 fallback:', error.message);
      return compressedBase64;
    } else {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      return publicUrl;
    }
  } catch (err) {
    console.error(`Error uploading file to ${folder}:`, err);
    showToast(`Upload failed, using original base64 fallback.`, 'warning');
    try {
      return await compressImageCanvas(file, 800, 800, 0.75);
    } catch {
      return '';
    }
  }
}

// COMPRESS & UPLOAD IMAGES
async function handleImageFilesUpload(files) {
  if (files.length === 0) return;

  showToast(`Compressing & preparing ${files.length} images...`, 'warning');
  await ensureStorageBucketExists('product-images');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // 1. Core requirement: Compress Image using Canvas prior to uploading
      const compressedBase64 = await compressImageCanvas(file, 800, 800, 0.75);
      
      // Let's try uploading to Supabase Storage if configured, 
      // otherwise fallback gracefully to storing base64 strings!
      let savedUrl = compressedBase64;
      
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `watch-products/${fileName}`;
        
        // Convert Base64 back to Blob for storage uploading
        const response = await fetch(compressedBase64);
        const blob = await response.blob();

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(filePath, blob, { contentType: file.type, cacheControl: '3600' });

        if (error) {
          // Non-blocking warning: fallback to base64
          console.warn('Storage Bucket "product-images" is not pre-configured or mapped in RLS rules. Fallbacking gracefully to base64 metadata payload.', error.message);
        } else {
          // Resolve public URL
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
          savedUrl = publicUrl;
        }
      } catch (storeErr) {
        // Fallback Base64 string silently
      }

      uploadedImages.push(savedUrl);
      renderUploadedImagesPreview();

    } catch (err) {
      console.error('Image compression or upload crashed:', err);
      showToast(`Error processing file: ${file.name}`, 'error');
    }
  }

  showToast('Image processing finalized successfully.', 'success');
}

function compressImageCanvas(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate proportions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Output compressed string
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

function renderUploadedImagesPreview() {
  const previewGrid = document.getElementById('product-images-preview-grid');
  if (!previewGrid) return;

  if (uploadedImages.length === 0) {
    previewGrid.innerHTML = `<p class="text-[10px] text-slate-500 col-span-full italic text-center">No images uploaded or configured yet.</p>`;
    return;
  }

  previewGrid.innerHTML = '';
  uploadedImages.forEach((img, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = "group relative border border-slate-800 rounded-lg overflow-hidden h-16 bg-slate-950 cursor-grab active:cursor-grabbing";
    wrapper.draggable = true;
    wrapper.innerHTML = `
      <img src="${img}" class="h-full w-full object-cover" referrerPolicy="no-referrer" />
      <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
        <button type="button" onclick="moveImageLeft(${idx})" class="p-1 rounded bg-slate-900 text-gold-400 text-[10px]">◀</button>
        <button type="button" onclick="deleteUploadedImage(${idx})" class="p-1 rounded bg-red-950 text-red-400 text-[10px]" title="Purge Image">✕</button>
        <button type="button" onclick="moveImageRight(${idx})" class="p-1 rounded bg-slate-900 text-gold-400 text-[10px]">▶</button>
      </div>
      <span class="absolute bottom-1 left-1 bg-black/80 border border-slate-800 text-[8px] px-1 font-mono rounded text-slate-300">#${idx + 1}</span>
    `;

    // Implement Drag and drop reordering
    wrapper.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', idx);
    });

    wrapper.addEventListener('dragover', (e) => e.preventDefault());

    wrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      const originIdx = parseInt(e.dataTransfer.getData('text/plain'));
      if (originIdx !== idx) {
        // Swap or splice reorder
        const temp = uploadedImages[originIdx];
        uploadedImages.splice(originIdx, 1);
        uploadedImages.splice(idx, 0, temp);
        renderUploadedImagesPreview();
        showToast('Image sort order updated.', 'warning');
      }
    });

    previewGrid.appendChild(wrapper);
  });
}

// Image action delegates
export function deleteUploadedImage(idx) {
  uploadedImages.splice(idx, 1);
  renderUploadedImagesPreview();
  showToast('Image removed from preview staging.', 'warning');
}
window.deleteUploadedImage = deleteUploadedImage;

export function moveImageLeft(idx) {
  if (idx <= 0) return;
  const temp = uploadedImages[idx];
  uploadedImages[idx] = uploadedImages[idx - 1];
  uploadedImages[idx - 1] = temp;
  renderUploadedImagesPreview();
}
window.moveImageLeft = moveImageLeft;

export function moveImageRight(idx) {
  if (idx >= uploadedImages.length - 1) return;
  const temp = uploadedImages[idx];
  uploadedImages[idx] = uploadedImages[idx + 1];
  uploadedImages[idx + 1] = temp;
  renderUploadedImagesPreview();
}
window.moveImageRight = moveImageRight;


// Open products form modal drawer
export async function openProductModal(id = null) {
  const modal = document.getElementById('product-modal');
  const modalTitle = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');
  
  form.reset();
  uploadedImages = [];
  document.getElementById('product-form-id').value = '';
  document.getElementById('p-price-original').value = '0';
  document.getElementById('p-price-selling').value = '0';

  // Bind dropdown lists for selector elements
  bindDropdownSelectors();

  if (id) {
    modalTitle.textContent = 'Edit Watch Specifications';
    showToast('Fetching product specifications...', 'warning');

    try {
      const { data, error } = await supabase.from('products').select('*, product_images(image_url, sort_order)').eq('id', id).single();
      if (error) throw error;

      if (data) {
        data.images = data.product_images ? data.product_images.sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)).map(img => img.image_url) : [];
      }

      activeProduct = data;

      // Populate Inputs
      document.getElementById('product-form-id').value = data.id;
      document.getElementById('p-name').value = data.name || '';
      document.getElementById('p-slug').value = data.slug || '';
      document.getElementById('p-category').value = data.category_id || '';
      document.getElementById('p-brand').value = data.brand_id || '';
      document.getElementById('p-sku').value = data.sku || '';
      document.getElementById('p-barcode').value = data.barcode || '';
      document.getElementById('p-stock').value = data.stock_quantity || 0;
      document.getElementById('p-low-stock-warning').value = data.low_stock_warning || 3;
      document.getElementById('p-unlimited-stock').checked = data.unlimited_stock || false;
      document.getElementById('p-short-desc').value = data.short_description || '';
      document.getElementById('p-full-desc').value = data.full_description || '';
      
      document.getElementById('p-status').value = data.status || 'draft';
      document.getElementById('p-is-featured').checked = data.is_featured || false;
      document.getElementById('p-is-trending').checked = data.is_trending || false;
      document.getElementById('p-is-best-seller').checked = data.is_best_seller || false;
      
      document.getElementById('p-price-original').value = data.pricing_original || 0;
      document.getElementById('p-price-selling').value = data.pricing_selling || 0;
      document.getElementById('p-price-tax').value = data.pricing_tax || 18;
      document.getElementById('p-price-shipping').value = data.pricing_shipping || 0;
      
      document.getElementById('p-var-size').value = data.variant_size || '';
      document.getElementById('p-var-color').value = data.variant_color || '';
      document.getElementById('p-var-weight').value = data.variant_weight || '';
      document.getElementById('p-var-dims').value = data.variant_dimensions || '';
      document.getElementById('p-var-material').value = data.variant_material || '';
      
      document.getElementById('p-seo-title').value = data.seo_title || '';
      document.getElementById('p-seo-desc').value = data.seo_description || '';
      document.getElementById('p-seo-keywords').value = data.seo_keywords || '';

      // Set Tags Comma list
      document.getElementById('p-tags').value = data.tags ? data.tags.join(', ') : '';

      // Set Images preview sorted
      if (data.images) {
        uploadedImages = [...data.images];
      }
      document.getElementById('p-image-urls').value = data.images ? data.images.join('\n') : '';

    } catch (err) {
      showToast('Could not recover watch details.', 'error');
    }
  } else {
    modalTitle.textContent = 'Add Luxury Timepiece';
    activeProduct = null;
  }

  // Populate dynamic preview checkers
  const originalInput = document.getElementById('p-price-original');
  if (originalInput) {
    const event = new Event('input');
    originalInput.dispatchEvent(event);
  }

  renderUploadedImagesPreview();
  switchProductFormTab('pform-general'); // Reset inner tabs

  modal.classList.remove('hidden');
}
window.openProductModal = openProductModal;

export function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
}
window.closeProductModal = closeProductModal;

// Switch nested form tabs inside products drawer
export function switchProductFormTab(sectionId) {
  const sections = document.querySelectorAll('.pform-section');
  sections.forEach(s => s.classList.add('hidden'));

  document.getElementById(sectionId).classList.remove('hidden');

  // Highlight buttons styling
  const btns = document.querySelectorAll('.pform-tab');
  btns.forEach(btn => {
    if (btn.id === `btn-${sectionId}`) {
      btn.className = "pform-tab px-3 py-1.5 bg-slate-800 text-gold-500 rounded-lg font-semibold cursor-pointer";
    } else {
      btn.className = "pform-tab px-3 py-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer";
    }
  });
}
window.switchProductFormTab = switchProductFormTab;

function bindDropdownSelectors() {
  const pCat = document.getElementById('p-category');
  const pBrand = document.getElementById('p-brand');

  if (pCat) {
    pCat.innerHTML = categories.filter(c => c.name !== '__INSTAGRAM_IMAGES__').map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  if (pBrand) {
    pBrand.innerHTML = brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  }
}


// Delete watch product trigger
export function promptDeleteProduct(id) {
  const item = products.find(p => p.id === id);
  if (!item) return;

  openConfirmModal(
    'Confirm Deletion', 
    `Are you absolutely sure you want to purge the database entry for "${item.name}"? This will delete all catalog indices.`, 
    async () => {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;

        showToast('Successfully purged watch record.', 'success');
        logActivity('Purge Product Row', { name: item.name });
        fetchProducts();
        refreshAllData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  );
}
window.promptDeleteProduct = promptDeleteProduct;


// ==========================================
// CATEGORIES & BRANDS CRUD INTERFACES
// ==========================================
async function fetchCategoriesAndBrands() {
  try {
    const { data: cats, error: cErr } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (cErr) throw cErr;
    categories = cats || [];

    const { data: brs, error: bErr } = await supabase.from('brands').select('*').order('name', { ascending: true });
    if (bErr) throw bErr;
    brands = brs || [];

    // Populate Category selectors filters in UI dynamically
    const filterCat = document.getElementById('filter-category');
    if (filterCat) {
      filterCat.innerHTML = `<option value="all">All Categories</option>` + 
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    const filterBr = document.getElementById('filter-brand');
    if (filterBr) {
      filterBr.innerHTML = `<option value="all">All Brands</option>` + 
        brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }

    // Render Categories Table
    renderCategoriesTable();
    // Render Brands Table
    renderBrandsTable();

  } catch (err) {
    console.error('Failed to load categories/brands index schema:', err);
  }
}

function renderCategoriesTable() {
  const table = document.getElementById('category-table-body');
  if (!table) return;

  const filteredCategories = categories.filter(c => c.name !== '__INSTAGRAM_IMAGES__');

  if (filteredCategories.length === 0) {
    table.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-500 italic">No category records.</td></tr>`;
    return;
  }

  table.innerHTML = '';
  filteredCategories.forEach(c => {
    const row = document.createElement('tr');
    row.className = "border-b border-slate-850 hover:bg-slate-900/20";
    row.innerHTML = `
      <td class="py-3"><img src="${c.image_url || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=60'}" class="h-8 w-8 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" /></td>
      <td class="py-3 font-bold text-white">${c.name}</td>
      <td class="py-3 text-slate-400 max-w-xs truncate" title="${c.description || ''}">${c.description || 'No description'}</td>
      <td class="py-3 text-right">
        <button onclick="openCategoryModal('${c.id}')" class="p-1 rounded text-slate-400 hover:text-white transition-colors">✏️</button>
        <button onclick="deleteCategory('${c.id}')" class="p-1 rounded text-slate-400 hover:text-red-400 transition-colors">🗑️</button>
      </td>
    `;
    table.appendChild(row);
  });
}

function renderBrandsTable() {
  const table = document.getElementById('brand-table-body');
  if (!table) return;

  if (brands.length === 0) {
    table.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-500 italic">No brand houses registered.</td></tr>`;
    return;
  }

  table.innerHTML = '';
  brands.forEach(b => {
    const row = document.createElement('tr');
    row.className = "border-b border-slate-850 hover:bg-slate-900/20";
    row.innerHTML = `
      <td class="py-3"><img src="${b.logo_url || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=60'}" class="h-8 w-8 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" /></td>
      <td class="py-3 font-bold text-white">${b.name}</td>
      <td class="py-3 text-slate-400 max-w-xs truncate" title="${b.description || ''}">${b.description || 'No description'}</td>
      <td class="py-3 text-right">
        <button onclick="openBrandModal('${b.id}')" class="p-1 rounded text-slate-400 hover:text-white transition-colors">✏️</button>
        <button onclick="deleteBrand('${b.id}')" class="p-1 rounded text-slate-400 hover:text-red-400 transition-colors">🗑️</button>
      </td>
    `;
    table.appendChild(row);
  });
}

// Category triggers
export function openCategoryModal(id = null) {
  const modal = document.getElementById('category-modal');
  const title = document.getElementById('category-modal-title');
  const form = document.getElementById('category-form');
  
  form.reset();
  document.getElementById('category-form-id').value = '';

  if (id) {
    title.textContent = 'Edit Watch Category';
    const cat = categories.find(c => c.id === id);
    if (cat) {
      document.getElementById('category-form-id').value = cat.id;
      document.getElementById('cat-name').value = cat.name;
      document.getElementById('cat-image').value = cat.image_url || '';
      document.getElementById('cat-desc').value = cat.description || '';
    }
  } else {
    title.textContent = 'Add Watch Category';
  }
  modal.classList.remove('hidden');
}
window.openCategoryModal = openCategoryModal;

export function closeCategoryModal() {
  document.getElementById('category-modal').classList.add('hidden');
}
window.closeCategoryModal = closeCategoryModal;

export function deleteCategory(id) {
  const cat = categories.find(c => c.id === id);
  if (!cat) return;

  openConfirmModal('Purge Category', `Purge category "${cat.name}"? Products under this category will have their category reference cleared.`, async () => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      showToast('Category successfully purged.', 'success');
      logActivity('Delete Category', { name: cat.name });
      fetchCategoriesAndBrands();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
window.deleteCategory = deleteCategory;


// Brand triggers
export function openBrandModal(id = null) {
  const modal = document.getElementById('brand-modal');
  const title = document.getElementById('brand-modal-title');
  const form = document.getElementById('brand-form');

  form.reset();
  document.getElementById('brand-form-id').value = '';

  if (id) {
    title.textContent = 'Edit Brand House';
    const b = brands.find(x => x.id === id);
    if (b) {
      document.getElementById('brand-form-id').value = b.id;
      document.getElementById('br-name').value = b.name;
      document.getElementById('br-logo').value = b.logo_url || '';
      document.getElementById('br-desc').value = b.description || '';
    }
  } else {
    title.textContent = 'Add Brand House';
  }
  modal.classList.remove('hidden');
}
window.openBrandModal = openBrandModal;

export function closeBrandModal() {
  document.getElementById('brand-modal').classList.add('hidden');
}
window.closeBrandModal = closeBrandModal;

export function deleteBrand(id) {
  const b = brands.find(x => x.id === id);
  if (!b) return;

  openConfirmModal('De-register Brand House', `Are you sure you wish to delete the brand maker: "${b.name}"?`, async () => {
    try {
      const { error } = await supabase.from('brands').delete().eq('id', id);
      if (error) throw error;
      showToast('Brand House successfully purged.', 'success');
      logActivity('Delete Brand', { name: b.name });
      fetchCategoriesAndBrands();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
window.deleteBrand = deleteBrand;


// ==========================================
// STOCK & TRANSACTION AUDIT MODULES
// ==========================================
async function fetchProductsForQuickStock() {
  const container = document.getElementById('quick-stock-adjuster-rows');
  if (!container) return;

  container.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">Retrieving quick counts...</td></tr>`;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, stock_quantity, status')
      .order('name', { ascending: true });

    if (error) throw error;

    if (data.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">No catalog products registered yet.</td></tr>`;
      return;
    }

    container.innerHTML = '';
    data.forEach(p => {
      const row = document.createElement('tr');
      row.className = "hover:bg-slate-900/20";
      row.innerHTML = `
        <td class="p-3 font-semibold text-white">${p.name}</td>
        <td class="p-3 font-mono text-slate-400 text-xs">${p.sku || 'N/A'}</td>
        <td class="p-3 text-center">
          <span id="quick-stock-display-${p.id}" class="px-2 py-0.5 rounded bg-slate-950 border border-slate-850 font-mono text-gold-400 font-bold">${p.stock_quantity}</span>
        </td>
        <td class="p-3">
          <div class="flex items-center gap-1.5">
            <button onclick="quickStockAdjust('${p.id}', -5)" class="px-2 py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 font-bold rounded cursor-pointer">-5</button>
            <button onclick="quickStockAdjust('${p.id}', -1)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded cursor-pointer">-1</button>
            <button onclick="quickStockAdjust('${p.id}', 1)" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded cursor-pointer">+1</button>
            <button onclick="quickStockAdjust('${p.id}', 5)" class="px-2 py-1 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 font-bold rounded cursor-pointer">+5</button>
          </div>
        </td>
        <td class="p-3 text-right">
          <button onclick="commitStockChanges('${p.id}')" class="px-3.5 py-1.5 bg-gold-500 hover:bg-gold-400 text-black text-[10px] font-sans font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer">
            Commit Changes
          </button>
        </td>
      `;
      container.appendChild(row);
    });

  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-400">Failed to load quick stocks: ${err.message}</td></tr>`;
  }
}

// Temporary in-memory adjustments prior to commit
const localAdjustments = {};

export function quickStockAdjust(productId, scale) {
  const display = document.getElementById(`quick-stock-display-${productId}`);
  if (!display) return;

  const currentDisplayVal = parseInt(display.textContent);
  const targetVal = Math.max(currentDisplayVal + scale, 0);

  display.textContent = targetVal;
  localAdjustments[productId] = (localAdjustments[productId] || 0) + scale;

  if (targetVal <= 0) {
    display.className = "px-2 py-0.5 rounded bg-red-950 border border-red-900 text-red-400 font-mono font-bold";
  } else {
    display.className = "px-2 py-0.5 rounded bg-slate-950 border border-slate-850 font-mono text-gold-400 font-bold";
  }
}
window.quickStockAdjust = quickStockAdjust;

export async function commitStockChanges(productId) {
  const display = document.getElementById(`quick-stock-display-${productId}`);
  if (!display) return;

  const targetStock = parseInt(display.textContent);
  const adjustmentScale = localAdjustments[productId] || 0;

  if (adjustmentScale === 0) {
    showToast('No pending stock counts scale adjusted.', 'warning');
    return;
  }

  showToast('Updating stock volumes in Cloud SQL...', 'warning');

  try {
    // 1. Update Products Table
    const { error: pErr } = await supabase
      .from('products')
      .update({ stock_quantity: targetStock })
      .eq('id', productId);

    if (pErr) throw pErr;

    // 2. Insert into inventory history transaction ledger
    const { error: logErr } = await supabase
      .from('inventory_history')
      .insert({
        product_id: productId,
        change_amount: adjustmentScale,
        current_stock: targetStock,
        reason: 'Manual adjustment via Control Command Deck'
      });

    if (logErr) console.warn('Inventory Ledger Log Error:', logErr.message);

    showToast('Warehouse ledger counts successfully locked & synced.', 'success');
    logActivity('Commit Stock Count', { product_id: productId, shift: adjustmentScale, total: targetStock });
    
    // Clear temp local tracker
    localAdjustments[productId] = 0;
    
    await fetchInventoryLogs();
    await refreshAllData();

  } catch (err) {
    showToast(`Failed to update stock counts: ${err.message}`, 'error');
  }
}
window.commitStockChanges = commitStockChanges;

async function fetchInventoryLogs() {
  const container = document.getElementById('inventory-history-rows');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('inventory_history')
      .select('created_at, change_amount, current_stock, reason, products(name)')
      .order('created_at', { ascending: false })
      .limit(15);

    if (error) throw error;

    if (data.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">Warehouse ledger empty.</td></tr>`;
      return;
    }

    container.innerHTML = '';
    data.forEach(log => {
      const date = new Date(log.created_at).toLocaleString();
      const productTitle = log.products ? log.products.name : 'Exclusive Watch';
      const changeClass = log.change_amount >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold';
      const changePrefix = log.change_amount >= 0 ? '+' : '';

      const row = document.createElement('tr');
      row.className = "border-b border-slate-850 text-xs";
      row.innerHTML = `
        <td class="p-3 text-slate-500 font-mono text-[11px]">${date}</td>
        <td class="p-3 font-semibold text-white">${productTitle}</td>
        <td class="p-3 font-mono ${changeClass}">${changePrefix}${log.change_amount}</td>
        <td class="p-3 font-mono text-slate-300">${log.current_stock} pcs</td>
        <td class="p-3 text-slate-400">${log.reason}</td>
      `;
      container.appendChild(row);
    });

  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-400">Failed to load transactions log ledger: ${err.message}</td></tr>`;
  }
}


// ==========================================
// COUPON & DISCOUNT PROMOTIONS LOGIC
// ==========================================
async function fetchCoupons() {
  const container = document.getElementById('coupons-table-body');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    coupons = data || [];

    if (coupons.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500 italic">No coupons active inside secure vault database.</td></tr>`;
      return;
    }

    container.innerHTML = '';
    coupons.forEach(c => {
      const typeLabel = c.discount_type === 'percentage' ? 'Percentage (%)' : 'Flat (INR)';
      const valLabel = c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${Number(c.discount_value).toLocaleString('en-IN')}`;
      
      const start = c.start_date ? new Date(c.start_date).toLocaleDateString() : 'N/A';
      const end = c.end_date ? new Date(c.end_date).toLocaleDateString() : 'N/A';

      const isActiveBadge = c.is_active 
        ? '<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold font-mono">ACTIVE</span>'
        : '<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">EXPIRED/VOID</span>';

      const row = document.createElement('tr');
      row.className = "hover:bg-slate-900/20 border-b border-slate-850 text-xs";
      row.innerHTML = `
        <td class="p-4 font-mono font-bold text-gold-400">${c.code}</td>
        <td class="p-4 text-slate-300">${typeLabel}</td>
        <td class="p-4 font-mono font-bold text-white">${valLabel}</td>
        <td class="p-4 text-slate-400">${start} to ${end}</td>
        <td class="p-4 text-center">${isActiveBadge}</td>
        <td class="p-4 text-right">
          <button onclick="toggleCouponState('${c.id}', ${c.is_active})" class="text-[10px] text-slate-400 hover:text-white underline cursor-pointer">
            ${c.is_active ? 'Void Code' : 'Activate Code'}
          </button>
        </td>
      `;
      container.appendChild(row);
    });

  } catch (err) {
    container.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-400">Failed to load coupons database: ${err.message}</td></tr>`;
  }
}

export function openCouponModal() {
  document.getElementById('coupon-modal').classList.remove('hidden');
}
window.openCouponModal = openCouponModal;

export function closeCouponModal() {
  document.getElementById('coupon-modal').classList.add('hidden');
}
window.closeCouponModal = closeCouponModal;

export async function toggleCouponState(id, currentState) {
  try {
    const { error } = await supabase
      .from('discounts')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) throw error;
    showToast('Promo Code status updated.', 'success');
    logActivity('Toggle Coupon Code State', { coupon_id: id, state: !currentState });
    fetchCoupons();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.toggleCouponState = toggleCouponState;


// ==========================================
// SECURITY AUDIT SYSTEM READ LOGS
// ==========================================
async function fetchAuditActivityLogs() {
  const container = document.getElementById('audit-table-body');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('created_at, action, details, ip_address, admins(email)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    if (data.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-500">Activity table empty.</td></tr>`;
      return;
    }

    container.innerHTML = '';
    data.forEach(log => {
      const date = new Date(log.created_at).toLocaleString();
      const adminName = log.admins ? log.admins.email : 'System Command';
      const detailStr = log.details ? JSON.stringify(log.details) : 'N/A';

      const row = document.createElement('tr');
      row.className = "hover:bg-slate-900/20 border-b border-slate-850 text-xs";
      row.innerHTML = `
        <td class="p-4 font-mono text-slate-500 text-[11px]">${date}</td>
        <td class="p-4 font-bold text-white">${adminName}</td>
        <td class="p-4 text-gold-400 font-medium">${log.action}</td>
        <td class="p-4 text-slate-400 font-mono text-[10px] max-w-xs truncate" title='${detailStr}'>${detailStr}</td>
        <td class="p-4 text-right font-mono text-slate-500 text-[11px]">${log.ip_address || '127.0.0.1'}</td>
      `;
      container.appendChild(row);
    });

  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-400">Failed to retrieve security event audits: ${err.message}</td></tr>`;
  }
}


// ==========================================
// CUSTOMER BOOKINGS & ORDERS MANAGEMENT
// ==========================================
async function fetchBookings() {
  const container = document.getElementById('bookings-table-body');
  if (!container) return;

  container.innerHTML = `
    <tr>
      <td colspan="8" class="p-8 text-center text-slate-500 font-mono">
        Querying secure bookings from cloud database...
      </td>
    </tr>
  `;

  try {
    let bookingsList = [];
    let tableUsed = 'bookings';

    let { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to fetch from bookings table, trying fallback orders table...', error.message);
      const fallback = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fallback.error) throw fallback.error;
      bookingsList = fallback.data || [];
      tableUsed = 'orders';
    } else {
      bookingsList = data || [];
    }

    if (bookingsList.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="8" class="p-12 text-center text-slate-500 italic">
            <span class="text-2xl">🛍️</span>
            <p class="mt-2 text-xs">No customer bookings or checkout records found.</p>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = '';
    bookingsList.forEach(b => {
      const dateStr = b.created_at ? new Date(b.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
      const status = b.status || 'Pending';
      const formattedPrice = `₹${Number(b.total_price || 0).toLocaleString('en-IN')}`;

      // Resolve items list
      let parsedItems = [];
      try {
        if (typeof b.items === 'string') {
          parsedItems = JSON.parse(b.items);
        } else if (Array.isArray(b.items)) {
          parsedItems = b.items;
        }
      } catch (e) {
        console.warn('Failed to parse booking items JSON:', e);
      }

      const itemsHtml = parsedItems.map(item => `
        <div class="py-1 border-b border-slate-850/40 last:border-0">
          <p class="font-bold text-slate-200">${item.name || 'Premium Timepiece'}</p>
          <div class="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
            <span class="font-mono text-gold-500">${item.brand || 'Independent'}</span>
            <span>•</span>
            <span class="text-slate-300">Qty: ${item.quantity || 1}</span>
            <span>•</span>
            <span class="font-mono text-slate-400">₹${Number(item.price || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      `).join('');

      // Status Badge Styling
      let statusBadge = '';
      if (status === 'Approved') {
        statusBadge = `<span class="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-black font-mono tracking-wider flex items-center justify-center gap-1">🟢 APPROVED</span>`;
      } else if (status === 'Rejected') {
        statusBadge = `<span class="px-2 py-1 rounded bg-red-950/80 border border-red-500/30 text-red-400 text-[10px] uppercase font-black font-mono tracking-wider flex items-center justify-center gap-1">🔴 REJECTED</span>`;
      } else {
        statusBadge = `<span class="px-2 py-1 rounded bg-amber-950/80 border border-amber-500/30 text-amber-400 text-[10px] uppercase font-black font-mono tracking-wider flex items-center justify-center gap-1 animate-pulse">🟡 PENDING</span>`;
      }

      // Actions HTML
      let actionsHTML = '';
      if (status === 'Pending') {
        actionsHTML = `
          <div class="flex items-center justify-end gap-2">
            <button onclick="approveBooking('${b.id}', '${tableUsed}')" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-emerald-500/10">
              ✓ Approve
            </button>
            <button onclick="rejectBooking('${b.id}', '${tableUsed}')" class="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-slate-950 text-[10px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-red-500/10">
              ✕ Reject
            </button>
          </div>
        `;
      } else if (status === 'Approved') {
        actionsHTML = `<span class="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-950/50">Approved by Admin</span>`;
      } else {
        actionsHTML = `<span class="text-[10px] font-bold text-red-400 bg-red-950/30 px-2 py-1 rounded border border-red-950/50">Rejected by Admin</span>`;
      }

      const row = document.createElement('tr');
      row.className = "hover:bg-slate-900/30 border-b border-slate-850 transition-colors";
      row.innerHTML = `
        <td class="p-4 font-bold text-white font-sans">${b.name}</td>
        <td class="p-4">
          <div class="space-y-1">
            <p class="font-mono text-slate-300">${b.phone}</p>
            <a href="https://wa.me/91${b.phone.replace(/[^0-9]/g, '')}" target="_blank" class="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10 transition-colors">
              💬 Whatsapp Chat
            </a>
          </div>
        </td>
        <td class="p-4 text-slate-400 max-w-xs truncate" title="${b.address}">${b.address}</td>
        <td class="p-4 max-w-xs">${itemsHtml}</td>
        <td class="p-4 font-mono font-bold text-gold-500">${formattedPrice}</td>
        <td class="p-4 font-mono text-slate-400 text-[11px]">${dateStr}</td>
        <td class="p-4 text-center">${statusBadge}</td>
        <td class="p-4 text-right">${actionsHTML}</td>
      `;
      container.appendChild(row);
    });

  } catch (err) {
    console.warn('Info: bookings/orders database tables are not initialized or empty yet:', err);
    container.innerHTML = `
      <tr>
        <td colspan="8" class="p-12 text-center text-slate-500 italic">
          <span class="text-2xl">🛍️</span>
          <p class="mt-2 text-xs">No customer bookings or checkout records found yet.</p>
          <p class="text-[10px] text-slate-600 mt-1">To view persistent real-time checkouts, please verify that the 'bookings' or 'orders' tables are created in your Supabase database schema.</p>
        </td>
      </tr>
    `;
  }
}
window.fetchBookings = fetchBookings;

async function parseItemsToText(items) {
  try {
    let parsed = [];
    if (typeof items === 'string') {
      parsed = JSON.parse(items);
    } else if (Array.isArray(items)) {
      parsed = items;
    }
    if (parsed.length > 0) {
      return parsed.map(item => `  • ${item.name || 'Premium Timepiece'} (Qty: ${item.quantity || 1})`).join('\n');
    }
  } catch (e) {
    console.warn(e);
  }
  return '';
}

async function approveBooking(id, tableUsed) {
  openConfirmModal(
    'Approve Booking Order',
    'Are you sure you want to approve this customer order? This marks the timepiece checkout as verified and updates booking status.',
    async () => {
      try {
        // Fetch the booking first to get customer details
        const { data: booking, error: fetchErr } = await supabase
          .from(tableUsed)
          .select('*')
          .eq('id', id)
          .single();

        if (fetchErr) throw fetchErr;

        const { error } = await supabase
          .from(tableUsed)
          .update({ status: 'Approved' })
          .eq('id', id);

        if (error) throw error;

        showToast('Booking Order approved successfully!', 'success');
        logActivity('Approve Customer Booking', { id, table: tableUsed });
        
        // Refresh
        fetchBookings();
        fetchDashboardMetrics();

        // Send WhatsApp message if phone exists
        if (booking && booking.phone) {
          const cleanPhone = booking.phone.replace(/[^0-9]/g, '');
          const itemsText = await parseItemsToText(booking.items);
          const message = `Hello *${booking.name}*!

Your order at *Sanwariya Watches* has been *APPROVED*! 🎉

📦 *Order Details*:
- *Ref ID*: #${booking.id.substring(0, 8)}
- *Total Price*: ₹${Number(booking.total_price || 0).toLocaleString('en-IN')}
${itemsText ? `- *Items*:\n${itemsText}` : ''}

Our team is currently preparing your premium timepieces for packaging and dispatch. You will receive tracking details shortly! 

Thank you for choosing Sanwariya Watches. If you have any questions, feel free to chat with us here.`;

          const encodedMsg = encodeURIComponent(message);
          const waUrl = `https://wa.me/91${cleanPhone}?text=${encodedMsg}`;
          
          showToast('Opening WhatsApp to send order status notification...', 'info');
          setTimeout(() => {
            window.open(waUrl, '_blank');
          }, 1200);
        }
      } catch (err) {
        showToast(`Failed to approve order: ${err.message}`, 'error');
      }
    }
  );
}
window.approveBooking = approveBooking;

async function rejectBooking(id, tableUsed) {
  openConfirmModal(
    'Reject Booking Order',
    'Are you sure you want to reject this customer order?',
    async () => {
      try {
        // Fetch the booking first to get customer details
        const { data: booking, error: fetchErr } = await supabase
          .from(tableUsed)
          .select('*')
          .eq('id', id)
          .single();

        if (fetchErr) throw fetchErr;

        const { error } = await supabase
          .from(tableUsed)
          .update({ status: 'Rejected' })
          .eq('id', id);

        if (error) throw error;

        showToast('Booking Order rejected.', 'warning');
        logActivity('Reject Customer Booking', { id, table: tableUsed });
        
        // Refresh
        fetchBookings();
        fetchDashboardMetrics();

        // Send WhatsApp message if phone exists
        if (booking && booking.phone) {
          const cleanPhone = booking.phone.replace(/[^0-9]/g, '');
          const message = `Hello *${booking.name}*,

We regret to inform you that your order reference *#${booking.id.substring(0, 8)}* at *Sanwariya Watches* has been *REJECTED*. ✕

If you have completed any payments or believe this is an error, please share your receipt with us here so our support team can verify and resolve this immediately.

Thank you for your patience and cooperation.`;

          const encodedMsg = encodeURIComponent(message);
          const waUrl = `https://wa.me/91${cleanPhone}?text=${encodedMsg}`;
          
          showToast('Opening WhatsApp to send order status notification...', 'info');
          setTimeout(() => {
            window.open(waUrl, '_blank');
          }, 1200);
        }
      } catch (err) {
        showToast(`Failed to reject order: ${err.message}`, 'error');
      }
    }
  );
}
window.rejectBooking = rejectBooking;


// ==========================================
// HELPER LOOKUP MATCHERS
// ==========================================
function getCategoryName(catId) {
  if (!catId) return 'General Series';
  const match = categories.find(c => c.id === catId);
  return match ? match.name : 'Unassigned';
}

function getBrandName(brandId) {
  if (!brandId) return 'Independent House';
  const match = brands.find(b => b.id === brandId);
  return match ? match.name : 'Unassigned';
}


// ==========================================
// DYNAMIC SECURE DIALOG ACTION POPUPS
// ==========================================
let activeConfirmCallback = null;

export function openConfirmModal(title, message, callback) {
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-message').textContent = message;
  
  activeConfirmCallback = callback;
  
  document.getElementById('confirm-modal').classList.remove('hidden');
}
window.openConfirmModal = openConfirmModal;

// Bind confirmation clickers
document.getElementById('btn-confirm-cancel').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.add('hidden');
  activeConfirmCallback = null;
});

document.getElementById('btn-confirm-approve').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.add('hidden');
  if (activeConfirmCallback) {
    activeConfirmCallback();
  }
  activeConfirmCallback = null;
});


// ==========================================
// THEME SWITCHING (DARK/LIGHT) UTILITIES
// ==========================================
function setupThemeToggler() {
  // Enforce premium luxury dark theme globally
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light');
}


// ==========================================
// ADMIN ROLES & USER MANAGEMENT
// ==========================================
let adminRoles = [];

export async function fetchAdminRoles() {
  const table = document.getElementById('admins-table-body');
  if (!table) return;

  table.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-500 font-mono animate-pulse">Retrieving admin roles...</td></tr>`;

  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('email', { ascending: true });

    if (error) throw error;
    adminRoles = data || [];

    if (adminRoles.length === 0) {
      table.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-500 italic">No admin mappings configured yet.</td></tr>`;
      return;
    }

    table.innerHTML = '';
    adminRoles.forEach(admin => {
      const row = document.createElement('tr');
      row.className = "border-b border-slate-850 hover:bg-slate-900/20 text-xs";
      row.innerHTML = `
        <td class="py-3 font-medium text-slate-200">${admin.email}</td>
        <td class="py-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
            admin.role === 'superadmin' 
              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
              : admin.role === 'admin' 
              ? 'bg-gold-500/10 text-gold-400 border-gold-500/20' 
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }">
            ${admin.role.toUpperCase()}
          </span>
        </td>
        <td class="py-3 font-mono text-slate-400 text-[10px] truncate max-w-[120px]" title="${admin.id}">${admin.id}</td>
        <td class="py-3 text-right">
          <button onclick="deleteAdminRole('${admin.id}', '${admin.email}')" class="p-1 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer" title="Revoke admin privileges">🗑️</button>
        </td>
      `;
      table.appendChild(row);
    });
  } catch (err) {
    console.error('Failed to load admins:', err);
    table.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-red-400 font-mono">Failed: ${err.message}</td></tr>`;
  }
}
window.fetchAdminRoles = fetchAdminRoles;

export function deleteAdminRole(id, email) {
  openConfirmModal(
    'Revoke Admin Access', 
    `Are you absolutely sure you want to revoke administrative access for "${email}"? They will lose access immediately.`, 
    async () => {
      try {
        const { error } = await supabase
          .from('admins')
          .delete()
          .eq('id', id);

        if (error) throw error;

        showToast(`Administrative privileges revoked for ${email}.`, 'success');
        logActivity('Revoke Admin Role', { email });
        fetchAdminRoles();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  );
}
window.deleteAdminRole = deleteAdminRole;

// ==========================================
// TAB 9: DYNAMIC INSTAGRAM WATCH DROPS SETTINGS
// ==========================================
export async function fetchInstagramSettings() {
  const grid = document.getElementById('instagram-manager-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="col-span-full text-center text-slate-400 font-mono py-10">Querying Supabase vault settings...</div>';

  try {
    // Check if the system category '__INSTAGRAM_IMAGES__' exists
    let { data: catRow, error } = await supabase
      .from('categories')
      .select('*')
      .eq('name', '__INSTAGRAM_IMAGES__')
      .maybeSingle();

    const fallbackUrls = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800',
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=800',
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800',
      'https://images.unsplash.com/photo-1622434641406-a158123450f9?q=80&w=800',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=800',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800'
    ];

    if (!catRow) {
      // Create '__INSTAGRAM_IMAGES__' category row dynamically to act as the settings document
      const { data: newRow, error: createError } = await supabase
        .from('categories')
        .insert([{
          name: '__INSTAGRAM_IMAGES__',
          description: JSON.stringify(fallbackUrls),
          image_url: fallbackUrls[0]
        }])
        .select()
        .single();

      if (createError) throw createError;
      catRow = newRow;
    }

    if (catRow && catRow.description) {
      try {
        const parsed = JSON.parse(catRow.description);
        if (Array.isArray(parsed) && parsed.length === 6) {
          instagramImages = parsed;
        } else {
          instagramImages = fallbackUrls;
        }
      } catch (parseErr) {
        instagramImages = fallbackUrls;
      }
    } else {
      instagramImages = fallbackUrls;
    }

    renderInstagramManager();
  } catch (err) {
    console.error('Failed to load Instagram watch drops config:', err);
    grid.innerHTML = `<div class="col-span-full text-center text-red-400 font-mono py-10">Vault query failed: ${err.message}</div>`;
  }
}
window.fetchInstagramSettings = fetchInstagramSettings;

function renderInstagramManager() {
  const grid = document.getElementById('instagram-manager-grid');
  if (!grid) return;

  grid.innerHTML = '';
  instagramImages.forEach((imgUrl, index) => {
    const card = document.createElement('div');
    card.className = "p-5 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col space-y-4 shadow-xl";
    card.innerHTML = `
      <div class="flex justify-between items-center border-b border-slate-800 pb-2">
        <span class="text-xs font-mono font-bold text-gold-500 uppercase tracking-widest">Watch Slot #${index + 1}</span>
        <span class="text-[9px] text-slate-500 uppercase">Only Watches</span>
      </div>

      <div class="h-44 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group">
        <img id="insta-preview-${index}" src="${imgUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}" class="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <p class="text-[10px] text-white font-bold tracking-widest uppercase">Live Showroom Drop Preview</p>
        </div>
      </div>

      <div class="space-y-2.5 text-xs">
        <div>
          <label class="block text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">Image URL String</label>
          <input type="text" id="insta-url-${index}" value="${imgUrl}" oninput="document.getElementById('insta-preview-${index}').src = this.value" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-[10px] focus:outline-none focus:border-gold-500" />
        </div>

        <div>
          <label class="block text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">Or Upload New Image</label>
          <div class="relative">
            <input type="file" id="insta-file-${index}" accept="image/*" class="hidden" />
            <button type="button" onclick="document.getElementById('insta-file-${index}').click()" class="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 font-sans font-bold text-[10px] uppercase border border-dashed border-slate-800 rounded-lg transition-all cursor-pointer">
              📁 Choose Local Image
            </button>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);

    // Bind file upload events
    const fileInput = document.getElementById(`insta-file-${index}`);
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const publicUrl = await uploadSingleFile(file, 'instagram-drops');
        if (publicUrl) {
          document.getElementById(`insta-url-${index}`).value = publicUrl;
          document.getElementById(`insta-preview-${index}`).src = publicUrl;
          showToast(`Uploaded watch slot #${index + 1} successfully!`, 'success');
        }
      } catch (uploadErr) {
        showToast('Image uploading failed.', 'error');
      }
    });
  });
}

export async function saveInstagramSettings() {
  const btn = document.getElementById('btn-save-instagram');
  btn.disabled = true;
  btn.textContent = '💾 Saving...';

  try {
    const urls = [];
    for (let i = 0; i < 6; i++) {
      const urlInput = document.getElementById(`insta-url-${i}`);
      if (urlInput && urlInput.value) {
        urls.push(urlInput.value);
      }
    }

    if (urls.length !== 6) {
      throw new Error('Please ensure all 6 image slots have valid URL strings.');
    }

    const { error } = await supabase
      .from('categories')
      .update({
        description: JSON.stringify(urls),
        image_url: urls[0]
      })
      .eq('name', '__INSTAGRAM_IMAGES__');

    if (error) throw error;

    instagramImages = urls;
    showToast('Dynamic Instagram Watch drops successfully saved & synchronized!', 'success');
    logActivity('Update Instagram Feed', { count: urls.length });
    fetchInstagramSettings();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Save All Changes';
  }
}
window.saveInstagramSettings = saveInstagramSettings;
