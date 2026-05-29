/**
 * Precision Salon OS — Shared App Utilities
 * Pure frontend prototype. No backend. All state in localStorage.
 */

/* ─── Cart ─────────────────────────────────────────────────────────── */
const Cart = {
  getCount() { return parseInt(localStorage.getItem('ps_cart_count') || '0'); },
  setCount(n) { localStorage.setItem('ps_cart_count', Math.max(0, n)); Cart.updateBadges(); },
  add(qty = 1) { Cart.setCount(Cart.getCount() + qty); },
  remove(qty = 1) { Cart.setCount(Cart.getCount() - qty); },
  clear() { Cart.setCount(0); localStorage.removeItem('ps_cart_items'); },
  updateBadges() {
    const n = Cart.getCount();
    document.querySelectorAll('.cart-badge').forEach(b => {
      b.textContent = n;
      b.style.display = n > 0 ? '' : 'none';
    });
  },
  addItem(item) {
    const items = Cart.getItems();
    items.push({ ...item, id: Date.now() });
    localStorage.setItem('ps_cart_items', JSON.stringify(items));
    Cart.setCount(Cart.getCount() + 1);
  },
  getItems() {
    try { return JSON.parse(localStorage.getItem('ps_cart_items') || '[]'); } catch { return []; }
  }
};

/* ─── Toast ─────────────────────────────────────────────────────────── */
const Toast = {
  _timer: null,
  show(msg, type = 'success', duration = 3000) {
    let t = document.getElementById('ps-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ps-toast';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);z-index:9999;padding:13px 24px;border-radius:10px;font-size:14px;font-weight:600;font-family:Libre Franklin,sans-serif;transition:all .35s cubic-bezier(0.34,1.56,0.64,1);white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.2);pointer-events:none;';
      document.body.appendChild(t);
    }
    const styles = {
      success: 'background:#1a5fa8;color:#fff;',
      error: 'background:#dc2626;color:#fff;',
      warning: 'background:#d97706;color:#fff;',
      info: 'background:#374151;color:#fff;'
    };
    t.style.cssText += styles[type] || styles.success;
    t.innerHTML = msg;
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(Toast._timer);
    Toast._timer = setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(80px)'; }, duration);
  }
};

/* ─── Form Validation ────────────────────────────────────────────────── */
const Validate = {
  rules: {
    required: (v) => !!v.trim(),
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    phone: (v) => /^(\+?60|0)[0-9]{8,10}$/.test(v.replace(/[\s-]/g, '')),
    minLen: (v, n) => v.trim().length >= n,
    password: (v) => v.length >= 8,
    checked: (el) => el.checked
  },
  showError(input, msg) {
    this.clearError(input);
    input.style.borderColor = '#ef4444';
    input.style.outline = 'none';
    const err = document.createElement('div');
    err.className = 'ps-field-error';
    err.textContent = msg;
    err.style.cssText = 'color:#ef4444;font-size:11px;margin-top:4px;font-family:Libre Franklin,sans-serif;';
    input.parentNode.insertBefore(err, input.nextSibling);
  },
  clearError(input) {
    input.style.borderColor = '';
    const err = input.parentNode.querySelector('.ps-field-error');
    if (err) err.remove();
  },
  clearAll(form) {
    form.querySelectorAll('input, select, textarea').forEach(f => this.clearError(f));
  },
  field(input) {
    const rules = input.dataset;
    let error = null;
    const v = input.value;
    if (input.type === 'checkbox' && rules.required) {
      if (!input.checked) error = rules.errorMsg || 'This checkbox is required';
    } else {
      if (rules.required && !v.trim()) error = rules.errorMsg || 'This field is required';
      else if (v.trim() && rules.email && !this.rules.email(v)) error = 'Enter a valid email address';
      else if (v.trim() && rules.phone && !this.rules.phone(v)) error = 'Enter a valid phone (+60...)';
      else if (v.trim() && data.minLen && !this.rules.minLen(v, parseInt(rules.minLen))) error = `Min ${rules.minLen} characters`;
      else if (v.trim() && rules.password && !this.rules.password(v)) error = 'Password must be at least 8 characters';
      else if (v.trim() && rules.match) {
        const target = document.querySelector(rules.match);
        if (target && v !== target.value) error = rules.matchMsg || 'Fields do not match';
      }
    }
    if (error) { this.showError(input, error); return false; }
    this.clearError(input); return true;
  },
  form(formEl) {
    let valid = true;
    formEl.querySelectorAll('[data-required]').forEach(input => {
      if (!this.field(input)) valid = false;
    });
    return valid;
  }
};

/* ─── Session (mock) ─────────────────────────────────────────────────── */
const Session = {
  isLoggedIn() { return localStorage.getItem('ps_session') === 'active'; },
  login(name, role = 'customer') {
    localStorage.setItem('ps_session', 'active');
    localStorage.setItem('ps_user_name', name || 'Member');
    localStorage.setItem('ps_user_role', role);
  },
  logout() {
    ['ps_session','ps_user_name','ps_user_role'].forEach(k => localStorage.removeItem(k));
  },
  getName() { return localStorage.getItem('ps_user_name') || 'Member'; },
  getRole() { return localStorage.getItem('ps_user_role') || 'customer'; },
  guard(redirectTo) {
    if (!this.isLoggedIn()) {
      const back = encodeURIComponent(window.location.href);
      window.location.href = (redirectTo || 'login.html') + '?redirect=' + back;
    }
  }
};

/* ─── Loading / Navigation ───────────────────────────────────────────── */
const Loading = {
  show() {
    let overlay = document.getElementById('ps-loading');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ps-loading';
      overlay.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;"><div class="ps-spinner"></div><div style="font-size:13px;color:#6b7280;font-family:Libre Franklin,sans-serif;">Loading…</div></div>';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(250,249,245,0.85);z-index:9998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  },
  hide() {
    const overlay = document.getElementById('ps-loading');
    if (overlay) overlay.style.display = 'none';
  },
  navigate(url, delay = 400) {
    Loading.show();
    setTimeout(() => { window.location.href = url; }, delay);
  }
};

/* ─── Empty State Helper ─────────────────────────────────────────────── */
const EmptyState = {
  render(container, config) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:12px;">
        <div style="font-size:56px;">${config.icon || '📭'}</div>
        <div style="font-size:18px;font-weight:700;color:#1b1c1a;">${config.title}</div>
        <div style="font-size:14px;color:#6b7280;max-width:320px;line-height:1.6;">${config.subtitle || ''}</div>
        ${config.action ? `<a href="${config.action.href}" style="margin-top:12px;padding:11px 24px;background:#1a5fa8;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;">${config.action.label}</a>` : ''}
      </div>`;
  }
};

/* ─── Skeleton Screen ────────────────────────────────────────────────── */
const Skeleton = {
  card: (n = 3) => Array(n).fill(`
    <div style="background:#fff;border:0.5px solid #E2E1DC;border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:10px;">
      <div class="ps-skel" style="height:120px;border-radius:6px;"></div>
      <div class="ps-skel" style="height:14px;width:70%;border-radius:4px;"></div>
      <div class="ps-skel" style="height:12px;width:40%;border-radius:4px;"></div>
    </div>`).join(''),
  row: (n = 4) => Array(n).fill(`
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:0.5px solid #E2E1DC;">
      <div class="ps-skel" style="width:44px;height:44px;border-radius:8px;flex-shrink:0;"></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
        <div class="ps-skel" style="height:13px;width:60%;border-radius:3px;"></div>
        <div class="ps-skel" style="height:11px;width:35%;border-radius:3px;"></div>
      </div>
      <div class="ps-skel" style="width:60px;height:13px;border-radius:3px;"></div>
    </div>`).join('')
};

/* ─── Modal Helper ───────────────────────────────────────────────────── */
const Modal = {
  show(config) {
    let overlay = document.getElementById('ps-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ps-modal-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9990;display:flex;align-items:center;justify-content:center;padding:20px;';
      overlay.onclick = (e) => { if (e.target === overlay) Modal.close(); };
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:28px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
        <div style="font-size:17px;font-weight:700;color:#1b1c1a;margin-bottom:10px;">${config.icon ? config.icon + ' ' : ''}${config.title}</div>
        <div style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:24px;">${config.message}</div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          ${config.cancelLabel ? `<button onclick="Modal.close()" style="padding:9px 20px;border:0.5px solid #E2E1DC;background:#fff;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;font-family:Libre Franklin,sans-serif;">${config.cancelLabel}</button>` : ''}
          <button onclick="Modal.confirm()" id="ps-modal-confirm" style="padding:9px 20px;background:${config.danger ? '#dc2626' : '#1a5fa8'};color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;font-family:Libre Franklin,sans-serif;">${config.confirmLabel || 'OK'}</button>
        </div>
      </div>`;
    overlay.style.display = 'flex';
    Modal._onConfirm = config.onConfirm;
  },
  confirm() {
    Modal.close();
    if (Modal._onConfirm) Modal._onConfirm();
  },
  close() {
    const o = document.getElementById('ps-modal-overlay');
    if (o) o.style.display = 'none';
  }
};

/* ─── Global Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Update cart badges
  Cart.updateBadges();

  // Clear field errors on input
  document.querySelectorAll('input, select, textarea').forEach(f => {
    f.addEventListener('input', () => Validate.clearError(f));
  });

  // Auto-highlight account sub-nav
  const p = window.location.pathname.split('/').pop();
  document.querySelectorAll('a[href]').forEach(a => {
    if (a.getAttribute('href') === p || a.href.endsWith('/' + p)) {
      if (a.style && a.style.borderBottom !== undefined) {
        a.style.color = '#1a5fa8';
        a.style.borderBottom = '2px solid #1a5fa8';
      }
    }
  });
});
