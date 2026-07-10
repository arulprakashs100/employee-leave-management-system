/* Profile and Settings management engine: profile.js */

const DB_USERS_STORE = 'lms_users_auth';
const DB_LEAVES_STORE = 'lms_leaves_auth';
const SESSION_STORE = 'lms_session_auth';

// Helper to format date
function formatProfileDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// 1. Guard check and load session
function checkProfileGuard() {
  const session = JSON.parse(localStorage.getItem(SESSION_STORE));
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

// 2. Render dynamic sidebar
function renderRoleSidebar(role) {
  const sidebar = document.getElementById('profile-sidebar');
  if (!sidebar) return;

  if (role === 'admin') {
    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">
          <i class="fa-solid fa-plane-departure"></i>
        </div>
        <span class="sidebar-logo-txt">Vortex HR</span>
      </div>

      <ul class="sidebar-menu">
        <li class="sidebar-item">
          <a href="admin-dashboard.html"><i class="fa-solid fa-house"></i> <span>Dashboard</span></a>
        </li>
        <li class="sidebar-item">
          <a href="employees.html"><i class="fa-solid fa-users"></i> <span>Employees</span></a>
        </li>
        <li class="sidebar-item">
          <a href="leave-requests.html"><i class="fa-solid fa-envelope-open-text"></i> <span>Leave Requests</span></a>
        </li>
        <li class="sidebar-item">
          <a href="approved-leaves.html"><i class="fa-solid fa-circle-check"></i> <span>Approved Leaves</span></a>
        </li>
        <li class="sidebar-item">
          <a href="rejected-leaves.html"><i class="fa-solid fa-circle-xmark"></i> <span>Rejected Leaves</span></a>
        </li>
        <li class="sidebar-item">
          <a href="reports.html"><i class="fa-solid fa-chart-pie"></i> <span>Reports</span></a>
        </li>
      </ul>

      <div class="sidebar-footer">
        <li class="sidebar-item" style="list-style: none;">
          <a href="#" class="logout-trigger"><i class="fa-solid fa-right-from-bracket"></i> <span>Logout</span></a>
        </li>
      </div>
    `;
  } else {
    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">
          <i class="fa-solid fa-plane-departure"></i>
        </div>
        <span class="sidebar-logo-txt">Vortex HR</span>
      </div>

      <ul class="sidebar-menu">
        <li class="sidebar-item">
          <a href="employee-dashboard.html"><i class="fa-solid fa-house"></i> <span>Dashboard</span></a>
        </li>
        <li class="sidebar-item">
          <a href="apply-leave.html"><i class="fa-solid fa-calendar-plus"></i> <span>Apply Leave</span></a>
        </li>
        <li class="sidebar-item">
          <a href="leave-status.html"><i class="fa-solid fa-clock-rotate-left"></i> <span>Leave Status</span></a>
        </li>
        <li class="sidebar-item active">
          <a href="profile.html"><i class="fa-solid fa-user-gear"></i> <span>Profile</span></a>
        </li>
      </ul>

      <div class="sidebar-footer">
        <li class="sidebar-item" style="list-style: none;">
          <a href="#" class="logout-trigger"><i class="fa-solid fa-right-from-bracket"></i> <span>Logout</span></a>
        </li>
      </div>
    `;
  }
}

// 3. Render Profile details
function renderProfileDetails(session) {
  const users = JSON.parse(localStorage.getItem(DB_USERS_STORE)) || [];
  const user = users.find(u => u.email === session.email);
  if (!user) return;

  const isEmp = user.role === 'employee';

  // Left card renders
  const avatarEl = document.getElementById('prof-card-avatar');
  const nameEl = document.getElementById('prof-card-name');
  const emailEl = document.getElementById('prof-card-email');
  const badgeEl = document.getElementById('prof-card-badge');
  const infoListEl = document.getElementById('prof-card-info-list');

  if (avatarEl) {
    if (user.avatar) {
      avatarEl.innerHTML = `<img src="${user.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    } else {
      avatarEl.textContent = user.name.charAt(0);
    }
  }

  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;
  
  if (badgeEl) {
    badgeEl.textContent = isEmp ? 'Employee' : 'Administrator';
    badgeEl.className = `profile-badge-role ${isEmp ? 'purple' : 'blue'}`;
  }

  // Load leaves counts
  const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
  
  if (infoListEl) {
    infoListEl.innerHTML = '';
    if (isEmp) {
      const empLeaves = leaves.filter(l => l.employeeId === user.id);
      const total = empLeaves.length;
      const approved = empLeaves.filter(l => l.status.toLowerCase() === 'approved').length;
      const pending = empLeaves.filter(l => l.status.toLowerCase() === 'pending').length;
      const rejected = empLeaves.filter(l => l.status.toLowerCase() === 'rejected').length;

      infoListEl.innerHTML = `
        <div class="profile-details-item"><span class="profile-details-lbl">Employee ID</span><span class="profile-details-val">${user.id}</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Branch</span><span class="profile-details-val">${user.branch || 'N/A'}</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Total Leaves</span><span class="profile-details-val">${total}</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Approved Leaves</span><span class="profile-details-val" style="color:var(--success-color)">${approved}</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Pending Leaves</span><span class="profile-details-val" style="color:var(--warning-color)">${pending}</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Rejected Leaves</span><span class="profile-details-val" style="color:var(--danger-color)">${rejected}</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Registration Date</span><span class="profile-details-val">${formatProfileDate(user.registeredDate || new Date())}</span></div>
      `;
    } else {
      // Admin summary
      const totalEmployees = users.filter(u => u.role === 'employee').length;
      const total = leaves.length;
      const approved = leaves.filter(l => l.status.toLowerCase() === 'approved').length;
      const rejected = leaves.filter(l => l.status.toLowerCase() === 'rejected').length;

      infoListEl.innerHTML = `
        <div class="profile-details-item"><span class="profile-details-lbl">Role</span><span class="profile-details-val">Administrator</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Total Employees</span><span class="profile-details-val">${totalEmployees}</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Total Leaves</span><span class="profile-details-val">${total}</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Approved Leaves</span><span class="profile-details-val" style="color:var(--success-color)">${approved}</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Rejected Leaves</span><span class="profile-details-val" style="color:var(--danger-color)">${rejected}</span></div>
        <div class="profile-details-item"><span class="profile-details-lbl">Status</span><span class="profile-details-val"><span class="badge approved">Active</span></span></div>
      `;
    }
  }

  // Populate Right Personal Form fields
  const inputName = document.getElementById('prof-input-name');
  const inputEmail = document.getElementById('prof-input-email');
  const inputId = document.getElementById('prof-input-id');
  const inputBranch = document.getElementById('prof-input-branch');
  const inputPhone = document.getElementById('prof-input-phone');
  
  const labelId = document.getElementById('label-prof-id');
  const labelBranch = document.getElementById('label-prof-branch');
  const labelPhone = document.getElementById('label-prof-phone');

  if (inputName) inputName.value = user.name;
  if (inputEmail) inputEmail.value = user.email;
  
  if (isEmp) {
    if (inputId) inputId.value = user.id;
    if (inputBranch) inputBranch.value = user.branch;
    if (inputPhone) inputPhone.value = user.phone || '';
  } else {
    // Hide Employee specific inputs for admin
    if (inputId && labelId) { inputId.style.display = 'none'; labelId.style.display = 'none'; }
    if (inputBranch && labelBranch) { inputBranch.style.display = 'none'; labelBranch.style.display = 'none'; }
    if (inputPhone && labelPhone) { inputPhone.style.display = 'none'; labelPhone.style.display = 'none'; }
  }
}

// 4. Tab switching logic
function setupProfileTabs() {
  const tabs = document.querySelectorAll('.profile-tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add('active');
    });
  });
}

// 5. Submit Save Changes (Edit profile)
function handleSaveProfile(session) {
  const name = document.getElementById('prof-input-name').value.trim();
  const phoneInput = document.getElementById('prof-input-phone');
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!name) {
    showToast('Name cannot be empty.', 'warning');
    return;
  }

  let avatarBase64 = null;
  const avatarImg = document.querySelector('.profile-avatar-img img');
  if (avatarImg) {
    avatarBase64 = avatarImg.src;
  }

  const payload = { name: name, phone: phone };
  if (avatarBase64) payload.avatar = avatarBase64;

  showLoader(1000);

  fetch(`http://localhost:8080/api/users/${session.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Update local cache for sync
      const users = JSON.parse(localStorage.getItem(DB_USERS_STORE)) || [];
      const idx = users.findIndex(u => u.id === session.id);
      if (idx !== -1) users[idx] = data.data;
      localStorage.setItem(DB_USERS_STORE, JSON.stringify(users));

      session.name = name;
      localStorage.setItem(SESSION_STORE, JSON.stringify(session));

      showToast('Profile updated successfully.', 'success');
      setTimeout(() => {
        renderProfileDetails(session);
      }, 450);
    } else {
      showToast('Failed to update profile.', 'error');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Backend connection failed', 'error');
  });
}

// Photo upload Base64 reader
function setupPhotoUploader() {
  const fileInput = document.getElementById('prof-avatar-file');
  const avatarWrapper = document.getElementById('prof-card-avatar');

  if (!fileInput || !avatarWrapper) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
      avatarWrapper.innerHTML = `<img src="${evt.target.result}" class="profile-avatar-img" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
      showToast('Click Save Changes to save your new profile picture.', 'info');
    };
    reader.readAsDataURL(file);
  });
}

// 6. Submit Change Password
function handleChangePassword(session) {
  const currentVal = document.getElementById('pwd-current').value;
  const newVal = document.getElementById('pwd-new').value;
  const confirmVal = document.getElementById('pwd-confirm').value;

  if (!currentVal || !newVal || !confirmVal) {
    showToast('Please fill all password fields.', 'warning');
    return;
  }

  if (newVal.length < 4) {
    showToast('New password must be at least 4 characters long.', 'warning');
    return;
  }

  if (newVal !== confirmVal) {
    showToast('Confirm password does not match new password.', 'error');
    return;
  }

  showLoader(1000);

  fetch(`http://localhost:8080/api/users/${session.id}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: currentVal, newPassword: newVal })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showToast('✅ Password changed successfully.', 'success');
      document.getElementById('pwd-current').value = '';
      document.getElementById('pwd-new').value = '';
      document.getElementById('pwd-confirm').value = '';
    } else {
      showToast(data.message || 'Incorrect current password.', 'error');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Backend connection failed', 'error');
  });
}

// 7. Settings Toggles
function setupSettingsToggles() {
  const themeToggle = document.getElementById('toggle-theme-dark');
  const emailToggle = document.getElementById('toggle-notif-email');
  const inappToggle = document.getElementById('toggle-notif-inapp');

  // Load initial settings states
  const themePref = localStorage.getItem('lms_theme_pref');
  if (themeToggle) themeToggle.checked = themePref === 'dark';

  const emailPref = localStorage.getItem('lms_notif_email') !== 'false';
  if (emailToggle) emailToggle.checked = emailPref;

  const inappPref = localStorage.getItem('lms_notif_inapp') !== 'false';
  if (inappToggle) inappToggle.checked = inappPref;

  // Listeners
  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('lms_theme_pref', 'dark');
        showToast('Dark Mode Enabled.', 'info');
      } else {
        document.documentElement.classList.remove('dark-theme');
        document.body.classList.remove('dark-theme');
        localStorage.setItem('lms_theme_pref', 'light');
        showToast('Light Mode Enabled.', 'info');
      }
    });
  }

  if (emailToggle) {
    emailToggle.addEventListener('change', (e) => {
      localStorage.setItem('lms_notif_email', e.target.checked);
      showToast(e.target.checked ? 'Email notifications enabled.' : 'Email notifications disabled.', 'info');
    });
  }

  if (inappToggle) {
    inappToggle.addEventListener('change', (e) => {
      localStorage.setItem('lms_notif_inapp', e.target.checked);
      showToast(e.target.checked ? 'In-app notifications enabled.' : 'In-app notifications disabled.', 'info');
    });
  }
}

// Document Load triggers
document.addEventListener('DOMContentLoaded', () => {
  const session = checkProfileGuard();
  if (!session) return;

  // Title elements based on role
  const subtitleEl = document.getElementById('profile-subtitle-txt');
  if (subtitleEl) {
    subtitleEl.textContent = session.role === 'admin' 
      ? 'Manage administrator account settings.' 
      : 'View and manage your personal account information.';
  }

  // Load components
  renderRoleSidebar(session.role);
  renderProfileDetails(session);
  setupProfileTabs();
  setupPhotoUploader();
  setupSettingsToggles();

  // Save changes click
  const saveBtn = document.getElementById('prof-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleSaveProfile(session);
    });
  }

  // Change password click
  const pwdBtn = document.getElementById('prof-password-btn');
  if (pwdBtn) {
    pwdBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleChangePassword(session);
    });
  }

  // Intercept logout clicks since we render the sidebar dynamically
  const profileContainer = document.getElementById('profile-sidebar');
  if (profileContainer) {
    profileContainer.addEventListener('click', (e) => {
      const logoutTrigger = e.target.closest('.logout-trigger');
      if (logoutTrigger) {
        e.preventDefault();
        e.stopPropagation();
        const confirmLogout = window.confirm('Are you sure you want to logout?');
        if (confirmLogout) {
          localStorage.removeItem(SESSION_STORE);
          window.location.href = 'login.html';
        }
      }
    });
  }
});
