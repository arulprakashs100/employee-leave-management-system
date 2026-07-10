/* Authentication and Core Caching engine: auth.js */

const DB_USERS = 'lms_users_auth';
const SESSION_KEY = 'lms_session_auth';
const DB_LEAVES = 'lms_leaves_auth';

// 1. Initialise Simulated DB on load
function initDatabase() {
  if (!localStorage.getItem(DB_USERS)) {
    const defaultAccounts = [
      {
        id: 'ADM001',
        name: 'HR Admin',
        email: 'admin@company.com',
        password: 'Admin@123', // Default admin password
        role: 'admin',
        branch: 'Human Resources (HR)'
      },
      {
        id: 'EMP101',
        name: 'Arul Prakash',
        email: 'arul@company.com',
        password: 'employee',
        role: 'employee',
        branch: 'Information Technology (IT)',
        registeredDate: '2026-07-10',
        status: 'Active'
      }
    ];
    localStorage.setItem(DB_USERS, JSON.stringify(defaultAccounts));
  }

  if (!localStorage.getItem(DB_LEAVES)) {
    const defaultLeaves = [
      {
        id: 'LV-501',
        employeeId: 'EMP101',
        employeeName: 'Arul Prakash',
        leaveType: 'Sick Leave',
        fromDate: '2026-07-10',
        toDate: '2026-07-11',
        days: 2,
        status: 'Pending',
        reason: 'Resting due to fever symptoms.',
        appliedDate: '2026-07-09'
      },
      {
        id: 'LV-502',
        employeeId: 'EMP101',
        employeeName: 'Arul Prakash',
        leaveType: 'Casual Leave',
        fromDate: '2026-07-02',
        toDate: '2026-07-03',
        days: 2,
        status: 'Approved',
        reason: 'Family event function.',
        appliedDate: '2026-07-01',
        approvedBy: 'HR Admin',
        approvedDate: '2026-07-02'
      },
      {
        id: 'LV-503',
        employeeId: 'EMP101',
        employeeName: 'Arul Prakash',
        leaveType: 'Emergency Leave',
        fromDate: '2026-06-05',
        toDate: '2026-06-05',
        days: 1,
        status: 'Rejected',
        reason: 'Urgent plumbing issue at home.',
        appliedDate: '2026-06-04',
        rejectedBy: 'HR Admin',
        rejectedDate: '2026-06-04',
        rejectionReason: 'Resource constraints and critical project deliverable.'
      }
    ];
    localStorage.setItem(DB_LEAVES, JSON.stringify(defaultLeaves));
  }

  const DB_ACTIVITIES = 'lms_activities_auth';
  if (!localStorage.getItem(DB_ACTIVITIES)) {
    const defaultActivities = [
      {
        id: 'ACT-101',
        text: 'Approved leave for Arul Prakash.',
        type: 'approved',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ACT-102',
        text: 'New employee registered: Arul Prakash.',
        type: 'registered',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem(DB_ACTIVITIES, JSON.stringify(defaultActivities));
  }
}

// 2. Toast renderer helper
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-xmark';
  if (type === 'warning') icon = 'fa-triangle-exclamation';
  if (type === 'info') icon = 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
    <i class="fa-solid fa-xmark toast-close"></i>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  const autoClose = setTimeout(() => closeToast(toast), 4000);
  
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(autoClose);
    closeToast(toast);
  });
}

function closeToast(toast) {
  toast.classList.remove('show');
  toast.addEventListener('transitionend', () => toast.remove());
}

// 3. Loading animation
function showLoader(duration = 500) {
  const spinner = document.createElement('div');
  spinner.className = 'spinner-backdrop';
  spinner.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(spinner);

  setTimeout(() => {
    spinner.style.opacity = '0';
    setTimeout(() => spinner.remove(), 400);
  }, duration);
}

// 4. Form Submit Triggers
document.addEventListener('DOMContentLoaded', () => {
  initDatabase();

  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  // Registration Submit logic
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim().toLowerCase();
      const pwd = document.getElementById('reg-password').value;
      const cpwd = document.getElementById('reg-c-password').value;
      const branch = document.getElementById('reg-branch').value;

      if (!name || !email || !pwd || !cpwd || !branch) {
        showToast('Please fill all registration fields.', 'warning');
        return;
      }

      if (pwd !== cpwd) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      if (pwd.length < 4) {
        showToast('Password must be at least 4 characters long.', 'warning');
        return;
      }

      showLoader(1000);
      const newEmp = {
        employeeId: `EMP${Math.floor(100 + Math.random() * 900)}`,
        name: name,
        email: email,
        password: pwd,
        branch: branch
      };

      fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmp)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('Registration Successful!', 'success');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 900);
        } else {
          showToast(data.message || 'Registration failed', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Backend connection failed', 'error');
      });
    });
  }

  // Login Submit logic
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const role = document.querySelector('input[name="login-role"]:checked').value;
      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        showToast('Please enter both Email and Password.', 'warning');
        return;
      }

      showLoader(1000);

      fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.role === role) {
          // Store active session session details
          localStorage.setItem(SESSION_KEY, JSON.stringify({
            id: data.data.id,
            name: data.data.name,
            email: data.data.email,
            role: data.data.role,
            branch: data.data.branch
          }));

          showToast('Login Successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'employee-dashboard.html';
          }, 800);
        } else {
          showToast(data.message || 'Invalid Email, Password, or Role', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Backend connection failed', 'error');
      });
    });
  }
});
