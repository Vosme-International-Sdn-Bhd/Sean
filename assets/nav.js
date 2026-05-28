/* Precision Salon OS — Navigation & Page Linking */

const NAV_PORTAL = [
  { label: 'Home', icon: '🏠', href: '../portal/home.html' },
  { label: 'Book Appointment', icon: '📅', href: '../portal/booking-service.html' },
  { label: 'My Bookings', icon: '📋', href: '../portal/my-bookings.html' },
  { label: 'Wallet', icon: '💳', href: '../portal/wallet-dashboard.html' },
  { label: 'Vouchers & Packages', icon: '🎟️', href: '../portal/vouchers-packages.html' },
  { label: 'Affiliate Hub', icon: '🤝', href: '../portal/affiliate-dashboard.html' },
  { label: 'Profile', icon: '👤', href: '../portal/member-profile.html' },
];

const NAV_ADMIN = [
  { section: 'Overview' },
  { label: 'Dashboard', icon: '📊', href: '../admin/dashboard.html' },
  { label: 'Bookings', icon: '📅', href: '../admin/bookings-schedule.html' },
  { label: 'Multi-Outlet Calendar', icon: '🗓️', href: '../admin/bookings-calendar.html' },
  { section: 'People' },
  { label: 'Members CRM', icon: '👥', href: '../admin/members-crm.html' },
  { label: 'Staff Management', icon: '🧑‍💼', href: '../admin/staff-management.html' },
  { label: 'Staff Performance', icon: '📈', href: '../admin/staff-performance.html' },
  { section: 'Finance' },
  { label: 'Revenue Reports', icon: '💰', href: '../admin/revenue-reports.html' },
  { label: 'Commission Engine', icon: '⚙️', href: '../admin/commission-engine.html' },
  { label: 'Payout Queue', icon: '📤', href: '../admin/payout-queue.html' },
  { label: 'LHDN MyInvois', icon: '🧾', href: '../admin/lhdn-dashboard.html' },
  { section: 'Inventory' },
  { label: 'Inventory Management', icon: '📦', href: '../admin/inventory-management.html' },
  { label: 'Inventory Reports', icon: '📊', href: '../admin/inventory-reports.html' },
  { section: 'Marketing' },
  { label: 'Campaigns', icon: '📣', href: '../admin/marketing-campaigns.html' },
  { label: 'Vouchers & Packages', icon: '🎟️', href: '../admin/voucher-builder.html' },
  { label: 'Service Packages', icon: '📦', href: '../admin/service-package-builder.html' },
  { label: 'Google Reviews', icon: '⭐', href: '../admin/google-reviews.html' },
  { label: 'Social Scheduler', icon: '📱', href: '../admin/social-scheduler.html' },
  { section: 'MLM / Affiliate' },
  { label: 'MLM Configuration', icon: '🌐', href: '../admin/mlm-config.html' },
  { label: 'MLM Tree', icon: '🌳', href: '../admin/mlm-tree.html' },
  { label: 'Affiliate Ranks', icon: '🏆', href: '../admin/affiliate-ranks.html' },
  { section: 'Settings' },
  { label: 'Outlet Settings', icon: '🏪', href: '../admin/outlet-settings.html' },
  { label: 'Outlet Management', icon: '🗺️', href: '../admin/outlet-management.html' },
  { label: 'Company & Hardware', icon: '🖥️', href: '../admin/company-hardware.html' },
  { label: 'Integrations', icon: '🔌', href: '../admin/integrations.html' },
  { label: 'Branding', icon: '🎨', href: '../admin/merchant-branding.html' },
  { label: 'Security', icon: '🔒', href: '../admin/security-settings.html' },
  { label: 'Superadmin', icon: '👑', href: '../admin/superadmin.html' },
];

const NAV_POS = [
  { label: 'Order Builder', icon: '🧾', href: '../pos/pos-home.html' },
  { label: 'Booking Calendar', icon: '📅', href: '../pos/booking-calendar.html' },
  { label: 'New Appointment', icon: '➕', href: '../pos/new-appointment.html' },
  { label: 'On-Hold Orders', icon: '⏸️', href: '../pos/on-hold-orders.html' },
  { label: 'Sync Status', icon: '🔄', href: '../pos/offline-sync.html' },
];

function buildSidebar(navItems, currentFile) {
  const current = currentFile || window.location.pathname.split('/').pop();
  let html = `<div class="sidebar">
    <div class="sidebar-logo">Precision Salon OS<span>MANAGEMENT PORTAL</span></div>
    <nav class="sidebar-nav">`;

  navItems.forEach(item => {
    if (item.section) {
      html += `<div class="nav-section-label">${item.section}</div>`;
    } else {
      const isActive = item.href && item.href.endsWith(current) ? 'active' : '';
      html += `<a class="nav-item ${isActive}" href="${item.href}"><span class="icon">${item.icon}</span>${item.label}</a>`;
    }
  });

  html += `</nav><div class="sidebar-footer">Precision Salon OS v2.0</div></div>`;
  return html;
}

function injectPortalNav(currentFile) {
  document.body.insertAdjacentHTML('afterbegin', buildSidebar(NAV_PORTAL, currentFile));
}
function injectAdminNav(currentFile) {
  document.body.insertAdjacentHTML('afterbegin', buildSidebar(NAV_ADMIN, currentFile));
}
function injectPOSNav(currentFile) {
  document.body.insertAdjacentHTML('afterbegin', buildSidebar(NAV_POS, currentFile));
}

// Stitch screen navigation overlay injector
function injectStitchNav(type, currentFile) {
  const navMap = { portal: NAV_PORTAL, admin: NAV_ADMIN, pos: NAV_POS };
  const items = navMap[type] || NAV_ADMIN;

  const overlay = document.createElement('div');
  overlay.id = 'psos-nav-overlay';
  overlay.style.cssText = `position:fixed;top:0;left:0;width:240px;height:100vh;background:#fff;border-right:0.5px solid #E2E1DC;z-index:9999;overflow-y:auto;font-family:'Libre Franklin',sans-serif;box-shadow:2px 0 8px rgba(0,0,0,0.06);display:flex;flex-direction:column;transform:translateX(0);transition:transform 0.2s;`;

  let navHTML = `<div style="padding:16px 20px;border-bottom:0.5px solid #E2E1DC;font-size:14px;font-weight:700;color:#1a5fa8;">Precision Salon OS<div style="font-size:10px;font-family:monospace;color:#727782;letter-spacing:0.5px;text-transform:uppercase;margin-top:2px;">${type.toUpperCase()} PORTAL</div></div><nav style="flex:1;padding:8px 0;overflow-y:auto;">`;

  items.forEach(item => {
    if (item.section) {
      navHTML += `<div style="padding:10px 20px 4px;font-size:10px;font-family:monospace;color:#727782;letter-spacing:0.5px;text-transform:uppercase;">${item.section}</div>`;
    } else {
      const href = item.href || '#';
      navHTML += `<a href="${href}" style="display:flex;align-items:center;gap:10px;padding:0 16px;height:42px;text-decoration:none;color:#424751;font-size:13px;font-weight:500;border-radius:8px;margin:1px 8px;transition:background 0.15s;" onmouseover="this.style.background='#f5f4f0'" onmouseout="this.style.background=''">${item.icon} ${item.label}</a>`;
    }
  });

  navHTML += `</nav><div style="padding:12px 20px;border-top:0.5px solid #E2E1DC;font-size:11px;color:#727782;">v2.0 · Malaysia</div>`;
  overlay.innerHTML = navHTML;

  // Toggle button
  const toggle = document.createElement('button');
  toggle.style.cssText = `position:fixed;top:12px;left:12px;z-index:10000;width:36px;height:36px;background:#1a5fa8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:16px;display:none;`;
  toggle.textContent = '☰';
  toggle.onclick = () => {
    const isOpen = overlay.style.transform === 'translateX(0px)' || overlay.style.transform === 'translateX(0)';
    overlay.style.transform = isOpen ? 'translateX(-240px)' : 'translateX(0)';
  };

  document.body.appendChild(overlay);
  document.body.appendChild(toggle);

  // Push content right
  document.body.style.paddingLeft = '240px';
}
