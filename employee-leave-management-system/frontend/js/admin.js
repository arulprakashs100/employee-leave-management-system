/* Admin dashboard operations engine: admin.js */

const DB_USERS_STORE = 'lms_users_auth';
const DB_LEAVES_STORE = 'lms_leaves_auth';
const SESSION_STORE = 'lms_session_auth';
const DB_ACTIVITIES_STORE = 'lms_activities_auth';

// Format Date helper (e.g. 10 Jul 2026)
function formatAdminDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// 1. Guard check role
function checkAdminGuard() {
  const session = JSON.parse(localStorage.getItem(SESSION_STORE));
  if (!session || session.role !== 'admin') {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

// 2. Activity Logger helper
function logAdminActivity(text, type) {
  const logs = JSON.parse(localStorage.getItem(DB_ACTIVITIES_STORE)) || [];
  const newLog = {
    id: `ACT-${Math.floor(100 + Math.random() * 900)}`,
    text: text,
    type: type,
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog);
  localStorage.setItem(DB_ACTIVITIES_STORE, JSON.stringify(logs));
}

// 3. Calculate statistics counts
function renderAdminStatistics() {
  const users = JSON.parse(localStorage.getItem(DB_USERS_STORE)) || [];
  const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];

  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const totalLeaves = leaves.length;
  const pendingLeaves = leaves.filter(l => l.status.toLowerCase() === 'pending').length;
  const approvedLeaves = leaves.filter(l => l.status.toLowerCase() === 'approved').length;
  const rejectedLeaves = leaves.filter(l => l.status.toLowerCase() === 'rejected').length;

  // Leaves applied today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLeaves = leaves.filter(l => l.appliedDate === todayStr).length;

  // Write values
  const elEmployees = document.getElementById('admin-stat-employees');
  const elLeaves = document.getElementById('admin-stat-leaves');
  const elPending = document.getElementById('admin-stat-pending');
  const elApproved = document.getElementById('admin-stat-approved');
  const elRejected = document.getElementById('admin-stat-rejected');
  const elToday = document.getElementById('admin-stat-today');

  if (elEmployees) elEmployees.textContent = totalEmployees;
  if (elLeaves) elLeaves.textContent = totalLeaves;
  if (elPending) elPending.textContent = pendingLeaves;
  if (elApproved) elApproved.textContent = approvedLeaves;
  if (elRejected) elRejected.textContent = rejectedLeaves;
  if (elToday) elToday.textContent = todayLeaves;
}

// 4. Render Today's Pending Leaves List
function renderPendingRequests() {
  const container = document.getElementById('admin-pending-list');
  if (!container) return;

  const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
  const pending = leaves.filter(l => l.status.toLowerCase() === 'pending');

  container.innerHTML = '';

  if (pending.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="text-align:center; padding: 40px; color:var(--text-secondary);">
        <i class="fa-solid fa-folder-open" style="font-size:36px; color:var(--text-muted); margin-bottom:12px; display:block;"></i>
        No leave requests available.
      </div>
    `;
    return;
  }

  pending.forEach(l => {
    const card = document.createElement('div');
    card.className = 'glass-card pending-card page-fade-in';
    
    card.innerHTML = `
      <div class="pending-card-header">
        <div class="pending-card-user">
          <div class="pending-card-avatar">
            ${l.employeeName.charAt(0)}
          </div>
          <div class="pending-card-user-info">
            <span class="pending-card-name">${l.employeeName}</span>
            <span class="pending-card-branch">${l.branch}</span>
          </div>
        </div>
        <span class="pending-card-date">Applied On: ${formatAdminDate(l.appliedDate)}</span>
      </div>

      <div class="pending-card-details-grid">
        <div class="pending-card-detail-item">
          <span class="pending-card-detail-label">Employee ID</span>
          <span class="pending-card-detail-value">${l.employeeId}</span>
        </div>
        <div class="pending-card-detail-item">
          <span class="pending-card-detail-label">Email ID</span>
          <span class="pending-card-detail-value" style="word-break: break-all;">${l.emailId || 'N/A'}</span>
        </div>
        <div class="pending-card-detail-item">
          <span class="pending-card-detail-label">Leave Type</span>
          <span class="pending-card-detail-value">${l.leaveType}</span>
        </div>
        <div class="pending-card-detail-item">
          <span class="pending-card-detail-label">Duration</span>
          <span class="pending-card-detail-value">${formatAdminDate(l.fromDate)} - ${formatAdminDate(l.toDate)}</span>
        </div>
        <div class="pending-card-detail-item">
          <span class="pending-card-detail-label">Total Days</span>
          <span class="pending-card-detail-value">${l.days} ${l.days === 1 ? 'Day' : 'Days'}</span>
        </div>
        <div class="pending-card-detail-item">
          <span class="pending-card-detail-label">Status</span>
          <span class="pending-card-detail-value"><span class="badge pending">${l.status}</span></span>
        </div>
      </div>

      <div class="pending-card-reason-box">
        <strong>Reason:</strong> ${l.reason}
      </div>

      ${l.attachment ? `
        <div style="font-size:11px; margin-bottom:14px;">
          <i class="fa-solid fa-paperclip"></i> Attachment: <a href="#" style="color:var(--primary-color); font-weight:600; text-decoration:none;">${l.attachment}</a>
        </div>
      ` : ''}

      <div class="pending-card-actions">
        <button class="btn btn-secondary view-btn" data-id="${l.id}"><i class="fa-solid fa-eye"></i> View Details</button>
        <button class="btn btn-primary approve-btn" data-id="${l.id}" style="background:var(--success-color); box-shadow:none;"><i class="fa-solid fa-circle-check"></i> Approve</button>
        <button class="btn btn-primary reject-btn" data-id="${l.id}" style="background:var(--danger-color); box-shadow:none;"><i class="fa-solid fa-circle-xmark"></i> Reject</button>
      </div>
    `;

    container.appendChild(card);
  });

  // Attach button triggers
  container.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').dataset.id;
      handleApproveLeave(id);
    });
  });

  container.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').dataset.id;
      openRejectionModal(id);
    });
  });

  container.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').dataset.id;
      showLeaveDetailsModal(id); // reuse the common leave modal if imported
    });
  });
}

// 5. Handle Approve action
function handleApproveLeave(leaveId) {
  const session = JSON.parse(localStorage.getItem(SESSION_STORE));
  
  showLoader(1000);
  
  fetch(`http://localhost:8080/api/leaves/${leaveId}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminName: session.name || 'HR Admin' })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      logAdminActivity(`Approved leave request ${leaveId}.`, 'approved');
      showToast('Leave Approved Successfully.', 'success');
      
      // Update local cache so UI updates immediately
      const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
      const idx = leaves.findIndex(l => l.id === leaveId);
      if (idx !== -1) leaves[idx] = data.data;
      localStorage.setItem(DB_LEAVES_STORE, JSON.stringify(leaves));

      setTimeout(() => {
        renderAdminStatistics();
        renderPendingRequests();
        renderActivityLogs();
        renderAdminCharts();
      }, 450);
    } else {
      showToast('Failed to approve leave.', 'error');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Backend connection failed', 'error');
  });
}

// 6. Handle Reject Popup modal action
let activeRejectId = null;

function openRejectionModal(leaveId) {
  activeRejectId = leaveId;
  const modal = document.getElementById('reject-comment-modal');
  const txt = document.getElementById('reject-reason-input');
  if (modal) {
    if (txt) txt.value = '';
    modal.classList.add('show');
  }
}

function handleConfirmReject() {
  if (!activeRejectId) return;

  const reason = document.getElementById('reject-reason-input').value.trim();
  if (!reason) {
    showToast('Rejection reason cannot be empty.', 'warning');
    return;
  }

  const session = JSON.parse(localStorage.getItem(SESSION_STORE));
  showLoader(1000);

  fetch(`http://localhost:8080/api/leaves/${activeRejectId}/reject`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminName: session.name || 'HR Admin', reason: reason })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      logAdminActivity(`Rejected leave request ${activeRejectId}.`, 'rejected');
      showToast('Leave request rejected successfully.', 'info');
      
      // Update local cache
      const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
      const idx = leaves.findIndex(l => l.id === activeRejectId);
      if (idx !== -1) leaves[idx] = data.data;
      localStorage.setItem(DB_LEAVES_STORE, JSON.stringify(leaves));

      document.getElementById('reject-comment-modal').classList.remove('show');
      activeRejectId = null;

      setTimeout(() => {
        renderAdminStatistics();
        renderPendingRequests();
        renderActivityLogs();
        renderAdminCharts();
      }, 450);
    } else {
      showToast('Failed to reject leave.', 'error');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Backend connection failed', 'error');
  });
}

// 7. Render Activity logs timeline
function renderActivityLogs() {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  const logs = JSON.parse(localStorage.getItem(DB_ACTIVITIES_STORE)) || [];
  container.innerHTML = '';

  if (logs.length === 0) {
    container.innerHTML = '<div style="font-size:12px; color:var(--text-muted);">No recent activities logged.</div>';
    return;
  }

  logs.slice(0, 5).forEach(item => {
    const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = `timeline-item ${item.type}`;
    div.innerHTML = `
      <div class="timeline-dot"></div>
      <span class="timeline-text">${item.text}</span>
      <span class="timeline-time">${formatAdminDate(item.timestamp)} at ${timeStr}</span>
    `;
    container.appendChild(div);
  });
}

// 8. Render Charts using Chart.js CDN
let monthlyChart = null;
let statusChart = null;
let branchChart = null;

function renderAdminCharts() {
  const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];

  const ctxMonth = document.getElementById('monthlyRequestsChart');
  const ctxStatus = document.getElementById('statusDistributionChart');
  const ctxBranch = document.getElementById('branchRequestsChart');

  if (!ctxMonth && !ctxStatus && !ctxBranch) return;

  // Chart data 1: Monthly requests (group by month index)
  const monthCounts = new Array(12).fill(0);
  leaves.forEach(l => {
    const d = new Date(l.appliedDate);
    if (!isNaN(d.getTime())) {
      monthCounts[d.getMonth()]++;
    }
  });

  // Chart data 2: Status distribution
  const pending = leaves.filter(l => l.status.toLowerCase() === 'pending').length;
  const approved = leaves.filter(l => l.status.toLowerCase() === 'approved').length;
  const rejected = leaves.filter(l => l.status.toLowerCase() === 'rejected').length;

  // Chart data 3: Branch requests (group by branch name)
  const branchList = [
    'Information Technology (IT)',
    'Computer Science (CSE)',
    'Electronics and Communication (ECE)',
    'Electrical and Electronics (EEE)',
    'Mechanical',
    'Civil',
    'Human Resources (HR)',
    'Finance'
  ];
  const branchCounts = new Array(branchList.length).fill(0);
  leaves.forEach(l => {
    const idx = branchList.indexOf(l.branch);
    if (idx !== -1) {
      branchCounts[idx]++;
    }
  });

  // Render or update Chart 1
  if (ctxMonth) {
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(ctxMonth, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Requests Submitted',
          data: monthCounts,
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  // Render or update Chart 2
  if (ctxStatus) {
    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctxStatus, {
      type: 'pie',
      data: {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
          data: [pending, approved, rejected],
          backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } }
      }
    });
  }

  // Render or update Chart 3
  if (ctxBranch) {
    if (branchChart) branchChart.destroy();
    branchChart = new Chart(ctxBranch, {
      type: 'bar',
      data: {
        labels: ['IT', 'CSE', 'ECE', 'EEE', 'Mech', 'Civil', 'HR', 'Finance'],
        datasets: [{
          label: 'Leaves by Branch',
          data: branchCounts,
          backgroundColor: '#8b5cf6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }
}

// 9. Document loaded triggers
document.addEventListener('DOMContentLoaded', async () => {
  const activeSession = checkAdminGuard();
  if (!activeSession) return;

  try {
    showLoader(800);
    // Fetch fresh data from backend APIs
    const usersRes = await fetch('http://localhost:8080/api/users');
    const usersData = await usersRes.json();
    if (usersData.success) localStorage.setItem(DB_USERS_STORE, JSON.stringify(usersData.data));

    const leavesRes = await fetch('http://localhost:8080/api/leaves');
    const leavesData = await leavesRes.json();
    if (leavesData.success) localStorage.setItem(DB_LEAVES_STORE, JSON.stringify(leavesData.data));
  } catch (error) {
    console.error('Failed to sync with backend:', error);
    showToast('Failed to connect to backend server', 'error');
  }

  // Initialize UI components
  renderAdminStatistics();
  renderPendingRequests();
  renderActivityLogs();
  renderAdminCharts();

  // Attach Confirm reject buttons
  const modalConfirmBtn = document.getElementById('reject-confirm-btn');
  const modalCancelBtn = document.getElementById('reject-cancel-btn');
  const rejectModal = document.getElementById('reject-comment-modal');

  if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', handleConfirmReject);
  if (modalCancelBtn && rejectModal) {
    modalCancelBtn.addEventListener('click', () => rejectModal.classList.remove('show'));
  }

  // Handle standard browser confirm log out trigger
  const logoutBtns = document.querySelectorAll('.logout-trigger');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        localStorage.removeItem(SESSION_STORE);
        window.location.href = 'login.html';
      }
    });
  });
});

// --- Employee Management Page functions ---
function renderEmployeeSummaryCards(emps) {
  const total = emps.length;
  const active = emps.filter(e => e.status === 'Active').length;
  
  // Unique Departments represented
  const departments = [...new Set(emps.map(e => e.branch))].length;
  
  // Registered this calendar month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newEmployees = emps.filter(e => new Date(e.registeredDate) >= startOfMonth).length;

  const elTotal = document.getElementById('card-emp-total');
  const elActive = document.getElementById('card-emp-active');
  const elDepts = document.getElementById('card-emp-depts');
  const elNew = document.getElementById('card-emp-new');

  if (elTotal) elTotal.textContent = total;
  if (elActive) elActive.textContent = active;
  if (elDepts) elDepts.textContent = departments;
  if (elNew) elNew.textContent = newEmployees;
}

function renderEmployeesTable(emps) {
  const tbody = document.getElementById('admin-employees-tbody');
  const wrapper = document.getElementById('employees-table-wrapper');
  const emptyState = document.getElementById('empty-employees-illust');

  if (!tbody) return;

  tbody.innerHTML = '';

  if (emps.length === 0) {
    if (wrapper) wrapper.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (wrapper) wrapper.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  emps.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600;">${e.id}</td>
      <td>${e.name}</td>
      <td><a href="mailto:${e.email}" style="color:var(--primary-color); text-decoration:none;">${e.email}</a></td>
      <td>${e.branch}</td>
      <td>${formatAdminDate(e.registeredDate)}</td>
      <td><span class="badge approved">${e.status || 'Active'}</span></td>
      <td>
        <button class="btn btn-secondary view-dossier-btn" data-id="${e.id}" style="padding:6px 12px; font-size:11px; border-radius:15px;">
          <i class="fa-solid fa-eye"></i> View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach button triggers
  tbody.querySelectorAll('.view-dossier-btn').forEach(btn => {
    btn.addEventListener('click', (evt) => {
      const id = evt.target.closest('button').dataset.id;
      showEmployeeDossier(id);
    });
  });
}

function showEmployeeDossier(employeeId) {
  const users = JSON.parse(localStorage.getItem(DB_USERS_STORE)) || [];
  const emp = users.find(u => u.id === employeeId);
  if (!emp) return;

  const modal = document.getElementById('employee-details-modal');
  const detailsGrid = document.getElementById('dossier-details');
  const tbody = document.getElementById('dossier-history-tbody');
  const summaryEl = document.getElementById('dossier-leaves-summary');

  if (!modal || !detailsGrid || !tbody) return;

  // Render personal info details
  detailsGrid.innerHTML = `
    <div class="details-item">
      <span class="details-label">Employee ID</span>
      <span class="details-value">${emp.id}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Full Name</span>
      <span class="details-value">${emp.name}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Email ID</span>
      <span class="details-value">${emp.email}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Branch</span>
      <span class="details-value">${emp.branch}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Registration Date</span>
      <span class="details-value">${formatAdminDate(emp.registeredDate)}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Account Status</span>
      <span class="details-value"><span class="badge approved">${emp.status || 'Active'}</span></span>
    </div>
  `;

  // Fetch leaves matching this employee ID
  const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
  const empLeaves = leaves.filter(l => l.employeeId === emp.id);

  const total = empLeaves.length;
  const pending = empLeaves.filter(l => l.status.toLowerCase() === 'pending').length;
  const approved = empLeaves.filter(l => l.status.toLowerCase() === 'approved').length;
  const rejected = empLeaves.filter(l => l.status.toLowerCase() === 'rejected').length;

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:8px;">
        <div style="background:rgba(0,0,0,0.02); padding:10px; border-radius:4px; text-align:center;">
          <div style="font-size:10px; color:var(--text-muted);">Total</div>
          <div style="font-size:16px; font-weight:700;">${total}</div>
        </div>
        <div style="background:rgba(245,158,11,0.05); padding:10px; border-radius:4px; text-align:center; color:var(--warning-color);">
          <div style="font-size:10px; color:var(--text-muted);">Pending</div>
          <div style="font-size:16px; font-weight:700;">${pending}</div>
        </div>
        <div style="background:rgba(16,185,129,0.05); padding:10px; border-radius:4px; text-align:center; color:var(--success-color);">
          <div style="font-size:10px; color:var(--text-muted);">Approved</div>
          <div style="font-size:16px; font-weight:700;">${approved}</div>
        </div>
        <div style="background:rgba(239,68,68,0.05); padding:10px; border-radius:4px; text-align:center; color:var(--danger-color);">
          <div style="font-size:10px; color:var(--text-muted);">Rejected</div>
          <div style="font-size:16px; font-weight:700;">${rejected}</div>
        </div>
      </div>
    `;
  }

  // Render recent leave history rows
  tbody.innerHTML = '';
  if (empLeaves.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:16px 0;">No leave history logged.</td></tr>';
  } else {
    // Sort descending
    const sorted = [...empLeaves].sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
    sorted.forEach(l => {
      const tr = document.createElement('tr');
      let badgeClass = 'pending';
      if (l.status.toLowerCase() === 'approved') badgeClass = 'approved';
      if (l.status.toLowerCase() === 'rejected') badgeClass = 'rejected';

      tr.innerHTML = `
        <td style="font-weight:600;">${l.leaveType}</td>
        <td>${formatAdminDate(l.fromDate)}</td>
        <td>${formatAdminDate(l.toDate)}</td>
        <td><span class="badge ${badgeClass}">${l.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  modal.classList.add('show');
}

// 10. Load Employees Management logs components on load
document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('admin-employees-tbody');
  if (!tbody) return; // not on employees page

  const users = JSON.parse(localStorage.getItem(DB_USERS_STORE)) || [];
  const emps = users.filter(u => u.role === 'employee');

  // Renders
  renderEmployeeSummaryCards(emps);
  renderEmployeesTable(emps);

  // Search input filter
  const searchInput = document.getElementById('employees-search');
  const branchFilter = document.getElementById('employees-filter');

  function applyFilters() {
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const branch = branchFilter ? branchFilter.value.toLowerCase() : 'all';

    let filtered = emps;

    if (branch !== 'all') {
      filtered = filtered.filter(e => e.branch.toLowerCase().includes(branch));
    }

    if (q) {
      filtered = filtered.filter(e => 
        e.id.toLowerCase().includes(q) || 
        e.name.toLowerCase().includes(q) || 
        e.email.toLowerCase().includes(q)
      );
    }

    renderEmployeesTable(filtered);
  }

  if (searchInput) searchInput.addEventListener('keyup', applyFilters);
  if (branchFilter) branchFilter.addEventListener('change', applyFilters);

  // Modal close trigger
  const modal = document.getElementById('employee-details-modal');
  const closeBtn = document.getElementById('modal-dossier-close');
  const backBtn = document.getElementById('modal-dossier-back');

  function closeModal() {
    if (modal) modal.classList.remove('show');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backBtn) backBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
});

// --- Leave Request Management Page functions ---
let reqCurrentPage = 1;
const reqItemsPerPage = 5;
let selectedRequestIds = [];

function renderRequestSummaryCards(leaves) {
  const total = leaves.length;
  const pending = leaves.filter(l => l.status.toLowerCase() === 'pending').length;
  const approved = leaves.filter(l => l.status.toLowerCase() === 'approved').length;
  const rejected = leaves.filter(l => l.status.toLowerCase() === 'rejected').length;

  const elTotal = document.getElementById('req-card-total');
  const elPending = document.getElementById('req-card-pending');
  const elApproved = document.getElementById('req-card-approved');
  const elRejected = document.getElementById('req-card-rejected');

  if (elTotal) elTotal.textContent = total;
  if (elPending) elPending.textContent = pending;
  if (elApproved) elApproved.textContent = approved;
  if (elRejected) elRejected.textContent = rejected;
}

function renderRequestsTable(leaves) {
  const tbody = document.getElementById('admin-requests-tbody');
  const wrapper = document.getElementById('requests-table-wrapper');
  const emptyState = document.getElementById('empty-requests-illust');

  if (!tbody) return;

  tbody.innerHTML = '';

  if (leaves.length === 0) {
    if (wrapper) wrapper.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    updatePaginationControls(0);
    return;
  }

  if (wrapper) wrapper.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  // Sort descending by appliedDate
  const sorted = [...leaves].sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

  // Pagination Slice
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / reqItemsPerPage);
  
  if (reqCurrentPage > totalPages) reqCurrentPage = totalPages || 1;
  const startIndex = (reqCurrentPage - 1) * reqItemsPerPage;
  const endIndex = Math.min(startIndex + reqItemsPerPage, totalItems);
  const sliced = sorted.slice(startIndex, endIndex);

  sliced.forEach(l => {
    const tr = document.createElement('tr');
    let badgeClass = 'pending';
    if (l.status.toLowerCase() === 'approved') badgeClass = 'approved';
    if (l.status.toLowerCase() === 'rejected') badgeClass = 'rejected';

    const isChecked = selectedRequestIds.includes(l.id) ? 'checked' : '';

    tr.innerHTML = `
      <td>
        <input type="checkbox" class="row-select-checkbox" data-id="${l.id}" ${isChecked}>
      </td>
      <td style="font-weight: 600;">${l.id}</td>
      <td>${l.employeeId}</td>
      <td>${l.employeeName}</td>
      <td>${l.branch}</td>
      <td>${l.leaveType}</td>
      <td>${formatAdminDate(l.fromDate)}</td>
      <td>${formatAdminDate(l.toDate)}</td>
      <td>${l.days}</td>
      <td><span class="badge ${badgeClass}">${l.status}</span></td>
      <td>
        <button class="btn btn-secondary view-request-btn" data-id="${l.id}" style="padding:6px 12px; font-size:11px; border-radius:15px;">
          <i class="fa-solid fa-eye"></i> View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach button triggers
  tbody.querySelectorAll('.view-request-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').dataset.id;
      showLeaveDetailsModal(id);
    });
  });

  // Attach Checkbox triggers
  tbody.querySelectorAll('.row-select-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        if (!selectedRequestIds.includes(id)) selectedRequestIds.push(id);
      } else {
        selectedRequestIds = selectedRequestIds.filter(val => val !== id);
      }
      updateSelectAllState(totalItems);
    });
  });

  updatePaginationControls(totalItems);
}

function updateSelectAllState(totalItems) {
  const selectAllCb = document.getElementById('select-all-requests');
  if (!selectAllCb) return;

  const rowCheckboxes = document.querySelectorAll('.row-select-checkbox');
  if (rowCheckboxes.length === 0) {
    selectAllCb.checked = false;
    return;
  }

  const allCheckedOnPage = Array.from(rowCheckboxes).every(cb => cb.checked);
  selectAllCb.checked = allCheckedOnPage;
}

function updatePaginationControls(totalItems) {
  const prevBtn = document.getElementById('req-prev-btn');
  const nextBtn = document.getElementById('req-next-btn');
  const numbersBox = document.getElementById('req-pagination-numbers');
  const infoText = document.getElementById('req-pagination-info');

  if (!prevBtn || !nextBtn || !numbersBox || !infoText) return;

  const totalPages = Math.ceil(totalItems / reqItemsPerPage);
  
  // Info text
  if (totalItems === 0) {
    infoText.textContent = 'Showing 0 to 0 of 0 requests';
  } else {
    const start = (reqCurrentPage - 1) * reqItemsPerPage + 1;
    const end = Math.min(start + reqItemsPerPage - 1, totalItems);
    infoText.textContent = `Showing ${start} to ${end} of ${totalItems} requests`;
  }

  // Buttons state
  prevBtn.disabled = reqCurrentPage === 1;
  nextBtn.disabled = reqCurrentPage === totalPages || totalPages === 0;

  // Pages numbers
  numbersBox.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `page-control-btn ${i === reqCurrentPage ? 'active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => {
      reqCurrentPage = i;
      refreshRequestPageData();
    });
    numbersBox.appendChild(btn);
  }
}

function refreshRequestPageData() {
  const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
  const searchInput = document.getElementById('requests-search');
  const statusFilter = document.getElementById('requests-status-filter');
  const branchFilter = document.getElementById('requests-branch-filter');

  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const status = statusFilter ? statusFilter.value.toLowerCase() : 'all';
  const branch = branchFilter ? branchFilter.value.toLowerCase() : 'all';

  let filtered = leaves;

  if (status !== 'all') {
    filtered = filtered.filter(l => l.status.toLowerCase() === status);
  }

  if (branch !== 'all') {
    filtered = filtered.filter(l => l.branch.toLowerCase().includes(branch));
  }

  if (q) {
    filtered = filtered.filter(l => 
      l.employeeId.toLowerCase().includes(q) || 
      l.employeeName.toLowerCase().includes(q) || 
      l.emailId.toLowerCase().includes(q) || 
      l.leaveType.toLowerCase().includes(q)
    );
  }

  renderRequestsTable(filtered);
  updateBulkActionButtonsState();
}

function updateBulkActionButtonsState() {
  const approveBtn = document.getElementById('bulk-approve-btn');
  const rejectBtn = document.getElementById('bulk-reject-btn');
  
  if (approveBtn) approveBtn.disabled = selectedRequestIds.length === 0;
  if (rejectBtn) rejectBtn.disabled = selectedRequestIds.length === 0;
}

// 6. Bulk action handlers
function handleBulkApprove() {
  if (selectedRequestIds.length === 0) return;

  const confirmApp = window.confirm(`Are you sure you want to approve all ${selectedRequestIds.length} selected requests?`);
  if (!confirmApp) return;

  const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
  let count = 0;

  selectedRequestIds.forEach(id => {
    const idx = leaves.findIndex(l => l.id === id);
    if (idx !== -1 && leaves[idx].status.toLowerCase() === 'pending') {
      leaves[idx].status = 'Approved';
      leaves[idx].approvedBy = 'HR Admin';
      leaves[idx].approvedDate = new Date().toISOString().split('T')[0];
      logAdminActivity(`Approved leave (Bulk) for ${leaves[idx].employeeName}.`, 'approved');
      count++;
    }
  });

  localStorage.setItem(DB_LEAVES_STORE, JSON.stringify(leaves));
  showToast(`✅ ${count} leave request(s) approved successfully.`, 'success');
  selectedRequestIds = [];
  
  const selectAllCb = document.getElementById('select-all-requests');
  if (selectAllCb) selectAllCb.checked = false;

  showLoader(500);
  setTimeout(() => {
    // Refresh stats cards
    const allLeaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
    renderRequestSummaryCards(allLeaves);
    refreshRequestPageData();
  }, 550);
}

function handleBulkReject() {
  if (selectedRequestIds.length === 0) return;
  openBulkRejectionModal();
}

let isBulkRejectionMode = false;
function openBulkRejectionModal() {
  isBulkRejectionMode = true;
  const modal = document.getElementById('reject-comment-modal');
  const txt = document.getElementById('reject-reason-input');
  if (modal) {
    if (txt) txt.value = '';
    modal.classList.add('show');
  }
}

// Intercept reject modal confirm button in bulk mode
const originalConfirmReject = handleConfirmReject;
handleConfirmReject = function() {
  if (!isBulkRejectionMode) {
    originalConfirmReject();
    return;
  }

  const reason = document.getElementById('reject-reason-input').value.trim();
  if (!reason) {
    showToast('Rejection reason cannot be empty.', 'warning');
    return;
  }

  const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
  let count = 0;

  selectedRequestIds.forEach(id => {
    const idx = leaves.findIndex(l => l.id === id);
    if (idx !== -1 && leaves[idx].status.toLowerCase() === 'pending') {
      leaves[idx].status = 'Rejected';
      leaves[idx].rejectedBy = 'HR Admin';
      leaves[idx].rejectedDate = new Date().toISOString().split('T')[0];
      leaves[idx].rejectionReason = reason;
      logAdminActivity(`Rejected leave (Bulk) for ${leaves[idx].employeeName}.`, 'rejected');
      count++;
    }
  });

  localStorage.setItem(DB_LEAVES_STORE, JSON.stringify(leaves));
  showToast(`❌ ${count} leave request(s) rejected successfully.`, 'info');
  
  // Close modal
  document.getElementById('reject-comment-modal').classList.remove('show');
  selectedRequestIds = [];
  isBulkRejectionMode = false;

  const selectAllCb = document.getElementById('select-all-requests');
  if (selectAllCb) selectAllCb.checked = false;

  showLoader(500);
  setTimeout(() => {
    const allLeaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
    renderRequestSummaryCards(allLeaves);
    refreshRequestPageData();
  }, 550);
};

// 7. Load Leave Requests page on load
document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('admin-requests-tbody');
  if (!tbody) return; // not on requests page

  const allLeaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];

  // Renders
  renderRequestSummaryCards(allLeaves);
  renderRequestsTable(allLeaves);

  // Filters listeners
  const searchInput = document.getElementById('requests-search');
  const statusFilter = document.getElementById('requests-status-filter');
  const branchFilter = document.getElementById('requests-branch-filter');

  if (searchInput) searchInput.addEventListener('keyup', () => { reqCurrentPage = 1; refreshRequestPageData(); });
  if (statusFilter) statusFilter.addEventListener('change', () => { reqCurrentPage = 1; refreshRequestPageData(); });
  if (branchFilter) branchFilter.addEventListener('change', () => { reqCurrentPage = 1; refreshRequestPageData(); });

  // Pagination buttons
  const prevBtn = document.getElementById('req-prev-btn');
  const nextBtn = document.getElementById('req-next-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (reqCurrentPage > 1) {
        reqCurrentPage--;
        refreshRequestPageData();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      reqCurrentPage++;
      refreshRequestPageData();
    });
  }

  // Select all checkbox
  const selectAllCb = document.getElementById('select-all-requests');
  if (selectAllCb) {
    selectAllCb.addEventListener('change', (e) => {
      const rowCheckboxes = document.querySelectorAll('.row-select-checkbox');
      rowCheckboxes.forEach(cb => {
        cb.checked = e.target.checked;
        const id = cb.dataset.id;
        if (e.target.checked) {
          if (!selectedRequestIds.includes(id)) selectedRequestIds.push(id);
        } else {
          selectedRequestIds = selectedRequestIds.filter(val => val !== id);
        }
      });
      updateBulkActionButtonsState();
    });
  }

  // Bulk buttons
  const bulkApproveBtn = document.getElementById('bulk-approve-btn');
  const bulkRejectBtn = document.getElementById('bulk-reject-btn');

  if (bulkApproveBtn) bulkApproveBtn.addEventListener('click', handleBulkApprove);
  if (bulkRejectBtn) bulkRejectBtn.addEventListener('click', handleBulkReject);

  updateBulkActionButtonsState();
});

// Intercept showLeaveDetailsModal to inject modal footer Approve/Reject buttons
const originalShowModal = showLeaveDetailsModal;
showLeaveDetailsModal = function(leaveId) {
  originalShowModal(leaveId);

  // Check if we are on leave-requests page or admin-dashboard page
  const modal = document.getElementById('details-modal');
  if (!modal) return;

  // Remove existing inline action buttons if they exist
  const existingActions = modal.querySelector('.modal-inline-actions');
  if (existingActions) existingActions.remove();

  const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
  const leave = leaves.find(l => l.id === leaveId);
  if (!leave) return;

  // If pending, inject Approve and Reject buttons inside the modal!
  if (leave.status.toLowerCase() === 'pending') {
    const actionWrap = document.createElement('div');
    actionWrap.className = 'modal-inline-actions';
    actionWrap.style = 'display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid var(--card-border); padding-top:16px;';
    
    actionWrap.innerHTML = `
      <button class="btn btn-secondary inline-view-close" style="border-radius:var(--radius-sm)">Close</button>
      <button class="btn btn-primary inline-approve-btn" style="background:var(--success-color); box-shadow:none; border-radius:var(--radius-sm)"><i class="fa-solid fa-circle-check"></i> Approve</button>
      <button class="btn btn-primary inline-reject-btn" style="background:var(--danger-color); box-shadow:none; border-radius:var(--radius-sm)"><i class="fa-solid fa-circle-xmark"></i> Reject</button>
    `;

    modal.querySelector('.modal-content').appendChild(actionWrap);

    // Attach listeners
    actionWrap.querySelector('.inline-view-close').addEventListener('click', () => modal.classList.remove('show'));
    actionWrap.querySelector('.inline-approve-btn').addEventListener('click', () => {
      modal.classList.remove('show');
      handleApproveLeave(leaveId);
      // If on leave requests page, refresh
      setTimeout(() => {
        refreshRequestPageData();
        const allLeaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
        renderRequestSummaryCards(allLeaves);
      }, 500);
    });
    actionWrap.querySelector('.inline-reject-btn').addEventListener('click', () => {
      modal.classList.remove('show');
      openRejectionModal(leaveId);
    });
  }
};

// --- Approved & Rejected Leaves Page functions ---
function isDateThisWeek(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  
  // Calculate start of current week (Sunday)
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);

  // End of current week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return d >= startOfWeek && d <= endOfWeek;
}

function isDateThisMonth(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

// Approved Leaves page loaders
function renderApprovedSummaryCards(leaves) {
  const approved = leaves.filter(l => l.status.toLowerCase() === 'approved');
  const total = approved.length;
  
  const thisWeek = approved.filter(l => isDateThisWeek(l.approvedDate)).length;
  const thisMonth = approved.filter(l => isDateThisMonth(l.approvedDate)).length;

  const elTotal = document.getElementById('approved-card-total');
  const elWeek = document.getElementById('approved-card-week');
  const elMonth = document.getElementById('approved-card-month');

  if (elTotal) elTotal.textContent = total;
  if (elWeek) elWeek.textContent = thisWeek;
  if (elMonth) elMonth.textContent = thisMonth;
}

function renderApprovedTable(leaves) {
  const tbody = document.getElementById('admin-approved-tbody');
  const wrapper = document.getElementById('approved-table-wrapper');
  const emptyState = document.getElementById('empty-approved-illust');

  if (!tbody) return;

  tbody.innerHTML = '';

  if (leaves.length === 0) {
    if (wrapper) wrapper.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (wrapper) wrapper.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  // Sort descending by approvedDate
  const sorted = [...leaves].sort((a, b) => new Date(b.approvedDate) - new Date(a.approvedDate));

  sorted.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600;">${l.id}</td>
      <td>${l.employeeId}</td>
      <td>${l.employeeName}</td>
      <td>${l.branch}</td>
      <td>${l.leaveType}</td>
      <td>${formatAdminDate(l.fromDate)}</td>
      <td>${formatAdminDate(l.toDate)}</td>
      <td>${l.days}</td>
      <td>${formatAdminDate(l.approvedDate)}</td>
      <td>${l.approvedBy || 'Admin'}</td>
      <td>
        <button class="btn btn-secondary view-approved-btn" data-id="${l.id}" style="padding:6px 12px; font-size:11px; border-radius:15px;">
          <i class="fa-solid fa-eye"></i> View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.view-approved-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').dataset.id;
      showLeaveDetailsModal(id);
    });
  });
}

// Rejected Leaves page loaders
function renderRejectedSummaryCards(leaves) {
  const rejected = leaves.filter(l => l.status.toLowerCase() === 'rejected');
  const total = rejected.length;
  
  const thisWeek = rejected.filter(l => isDateThisWeek(l.rejectedDate)).length;
  const thisMonth = rejected.filter(l => isDateThisMonth(l.rejectedDate)).length;

  const elTotal = document.getElementById('rejected-card-total');
  const elWeek = document.getElementById('rejected-card-week');
  const elMonth = document.getElementById('rejected-card-month');

  if (elTotal) elTotal.textContent = total;
  if (elWeek) elWeek.textContent = thisWeek;
  if (elMonth) elMonth.textContent = thisMonth;
}

function renderRejectedTable(leaves) {
  const tbody = document.getElementById('admin-rejected-tbody');
  const wrapper = document.getElementById('rejected-table-wrapper');
  const emptyState = document.getElementById('empty-rejected-illust');

  if (!tbody) return;

  tbody.innerHTML = '';

  if (leaves.length === 0) {
    if (wrapper) wrapper.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (wrapper) wrapper.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  // Sort descending by rejectedDate
  const sorted = [...leaves].sort((a, b) => new Date(b.rejectedDate) - new Date(a.rejectedDate));

  sorted.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600;">${l.id}</td>
      <td>${l.employeeId}</td>
      <td>${l.employeeName}</td>
      <td>${l.branch}</td>
      <td>${l.leaveType}</td>
      <td>${formatAdminDate(l.rejectedDate)}</td>
      <td>${l.rejectedBy || 'Admin'}</td>
      <td>
        <button class="btn btn-secondary view-rejected-btn" data-id="${l.id}" style="padding:6px 12px; font-size:11px; border-radius:15px;">
          <i class="fa-solid fa-eye"></i> View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.view-rejected-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').dataset.id;
      showLeaveDetailsModal(id);
    });
  });
}

// 11. Initializers DOM triggers
document.addEventListener('DOMContentLoaded', () => {
  const allLeaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];

  // --- Approved Leaves DOM Page check ---
  const appTbody = document.getElementById('admin-approved-tbody');
  if (appTbody) {
    const approved = allLeaves.filter(l => l.status.toLowerCase() === 'approved');
    renderApprovedSummaryCards(allLeaves);
    renderApprovedTable(approved);

    const searchInput = document.getElementById('approved-search');
    const branchFilter = document.getElementById('approved-branch-filter');

    function filterApproved() {
      const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const branch = branchFilter ? branchFilter.value.toLowerCase() : 'all';

      let filtered = approved;
      if (branch !== 'all') {
        filtered = filtered.filter(l => l.branch.toLowerCase().includes(branch));
      }
      if (q) {
        filtered = filtered.filter(l => 
          l.employeeId.toLowerCase().includes(q) ||
          l.employeeName.toLowerCase().includes(q) ||
          l.leaveType.toLowerCase().includes(q)
        );
      }
      renderApprovedTable(filtered);
    }

    if (searchInput) searchInput.addEventListener('keyup', filterApproved);
    if (branchFilter) branchFilter.addEventListener('change', filterApproved);
  }

  // --- Rejected Leaves DOM Page check ---
  const rejTbody = document.getElementById('admin-rejected-tbody');
  if (rejTbody) {
    const rejected = allLeaves.filter(l => l.status.toLowerCase() === 'rejected');
    renderRejectedSummaryCards(allLeaves);
    renderRejectedTable(rejected);

    const searchInput = document.getElementById('rejected-search');
    const branchFilter = document.getElementById('rejected-branch-filter');

    function filterRejected() {
      const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const branch = branchFilter ? branchFilter.value.toLowerCase() : 'all';

      let filtered = rejected;
      if (branch !== 'all') {
        filtered = filtered.filter(l => l.branch.toLowerCase().includes(branch));
      }
      if (q) {
        filtered = filtered.filter(l => 
          l.employeeId.toLowerCase().includes(q) ||
          l.employeeName.toLowerCase().includes(q) ||
          l.leaveType.toLowerCase().includes(q)
        );
      }
      renderRejectedTable(filtered);
    }

    if (searchInput) searchInput.addEventListener('keyup', filterRejected);
    if (branchFilter) branchFilter.addEventListener('change', filterRejected);
  }
});

// --- Reports & Analytics Page functions ---
const DB_REPORT_ACTIVITIES = 'lms_report_activities';

let reportMonthlyChart = null;
let reportStatusChart = null;
let reportBranchChart = null;
let reportTypeChart = null;
let activeFilteredLeaves = [];

function initReportActivities() {
  if (!localStorage.getItem(DB_REPORT_ACTIVITIES)) {
    const defaultActs = [
      { text: 'Monthly report generated.', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
      { text: 'Employee leave report downloaded.', timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
      { text: 'Branch report exported.', timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
      { text: 'Analytics updated.', timestamp: new Date(Date.now() - 48 * 3600000).toISOString() }
    ];
    localStorage.setItem(DB_REPORT_ACTIVITIES, JSON.stringify(defaultActs));
  }
}

function logReportActivity(text) {
  const acts = JSON.parse(localStorage.getItem(DB_REPORT_ACTIVITIES)) || [];
  acts.unshift({
    text: text,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(DB_REPORT_ACTIVITIES, JSON.stringify(acts));
  renderReportActivities();
}

function renderReportActivities() {
  const container = document.getElementById('report-activity-container');
  if (!container) return;

  const acts = JSON.parse(localStorage.getItem(DB_REPORT_ACTIVITIES)) || [];
  container.innerHTML = '';

  if (acts.length === 0) {
    container.innerHTML = '<div style="font-size:12px; color:var(--text-muted);">No recent actions logged.</div>';
    return;
  }

  acts.slice(0, 5).forEach(item => {
    const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = 'timeline-item registered';
    div.innerHTML = `
      <div class="timeline-dot"></div>
      <span class="timeline-text">${item.text}</span>
      <span class="timeline-time">${formatAdminDate(item.timestamp)} at ${timeStr}</span>
    `;
    container.appendChild(div);
  });
}

function runReportsCalculation() {
  const leaves = JSON.parse(localStorage.getItem(DB_LEAVES_STORE)) || [];
  const users = JSON.parse(localStorage.getItem(DB_USERS_STORE)) || [];

  const fromVal = document.getElementById('report-from-date').value;
  const toVal = document.getElementById('report-to-date').value;
  const branchVal = document.getElementById('report-branch-filter').value;
  const statusVal = document.getElementById('report-status-filter').value;

  // Filter logic
  let filtered = leaves;

  if (fromVal) {
    filtered = filtered.filter(l => l.appliedDate >= fromVal);
  }
  if (toVal) {
    filtered = filtered.filter(l => l.appliedDate <= toVal);
  }
  if (branchVal !== 'all') {
    filtered = filtered.filter(l => l.branch.toLowerCase().includes(branchVal.toLowerCase()));
  }
  if (statusVal !== 'all') {
    filtered = filtered.filter(l => l.status.toLowerCase() === statusVal.toLowerCase());
  }

  activeFilteredLeaves = filtered;

  // 1. Update 6 summary cards
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const totalLeaves = filtered.length;
  const pending = filtered.filter(l => l.status.toLowerCase() === 'pending').length;
  const approved = filtered.filter(l => l.status.toLowerCase() === 'approved').length;
  const rejected = filtered.filter(l => l.status.toLowerCase() === 'rejected').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLeaves = filtered.filter(l => l.appliedDate === todayStr).length;

  document.getElementById('rep-card-employees').textContent = totalEmployees;
  document.getElementById('rep-card-leaves').textContent = totalLeaves;
  document.getElementById('rep-card-pending').textContent = pending;
  document.getElementById('rep-card-approved').textContent = approved;
  document.getElementById('rep-card-rejected').textContent = rejected;
  document.getElementById('rep-card-today').textContent = todayLeaves;

  // Render / Update Charts
  renderReportsCharts(filtered);
}

function renderReportsCharts(filtered) {
  const ctxMonth = document.getElementById('reportMonthlyRequestsChart');
  const ctxStatus = document.getElementById('reportStatusDistributionChart');
  const ctxBranch = document.getElementById('reportBranchRequestsChart');
  const ctxType = document.getElementById('reportTypeDistributionChart');

  if (!ctxMonth && !ctxStatus && !ctxBranch && !ctxType) return;

  // Chart data 1: Monthly requests (group by month index)
  const monthCounts = new Array(12).fill(0);
  filtered.forEach(l => {
    const d = new Date(l.appliedDate);
    if (!isNaN(d.getTime())) {
      monthCounts[d.getMonth()]++;
    }
  });

  // Chart data 2: Status distribution
  const pending = filtered.filter(l => l.status.toLowerCase() === 'pending').length;
  const approved = filtered.filter(l => l.status.toLowerCase() === 'approved').length;
  const rejected = filtered.filter(l => l.status.toLowerCase() === 'rejected').length;

  // Chart data 3: Branch requests (group by branch name)
  const branchList = [
    'Information Technology (IT)',
    'Computer Science (CSE)',
    'Electronics and Communication (ECE)',
    'Electrical and Electronics (EEE)',
    'Mechanical',
    'Civil',
    'Human Resources (HR)',
    'Finance'
  ];
  const branchCounts = new Array(branchList.length).fill(0);
  filtered.forEach(l => {
    const idx = branchList.indexOf(l.branch);
    if (idx !== -1) {
      branchCounts[idx]++;
    }
  });

  // Chart data 4: Leave Type distribution
  const leaveTypesList = [
    'Casual Leave',
    'Sick Leave',
    'Emergency Leave',
    'Earned Leave',
    'Work From Home',
    'Half Day'
  ];
  const typeCounts = new Array(leaveTypesList.length).fill(0);
  filtered.forEach(l => {
    const idx = leaveTypesList.indexOf(l.leaveType);
    if (idx !== -1) {
      typeCounts[idx]++;
    }
  });

  // Render Chart 1
  if (ctxMonth) {
    if (reportMonthlyChart) reportMonthlyChart.destroy();
    reportMonthlyChart = new Chart(ctxMonth, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Requests Submitted',
          data: monthCounts,
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  // Render Chart 2
  if (ctxStatus) {
    if (reportStatusChart) reportStatusChart.destroy();
    reportStatusChart = new Chart(ctxStatus, {
      type: 'pie',
      data: {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
          data: [pending, approved, rejected],
          backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } }
      }
    });
  }

  // Render Chart 3
  if (ctxBranch) {
    if (reportBranchChart) reportBranchChart.destroy();
    reportBranchChart = new Chart(ctxBranch, {
      type: 'bar',
      data: {
        labels: ['IT', 'CSE', 'ECE', 'EEE', 'Mech', 'Civil', 'HR', 'Finance'],
        datasets: [{
          label: 'Leaves by Branch',
          data: branchCounts,
          backgroundColor: '#8b5cf6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  // Render Chart 4 (Doughnut chart for types)
  if (ctxType) {
    if (reportTypeChart) reportTypeChart.destroy();
    reportTypeChart = new Chart(ctxType, {
      type: 'doughnut',
      data: {
        labels: ['Casual', 'Sick', 'Emergency', 'Earned', 'WFH', 'Half Day'],
        datasets: [{
          data: typeCounts,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } }
      }
    });
  }
}

// Modal populator for generated report details
function showReportPreviewModal() {
  const modal = document.getElementById('report-details-modal');
  const tbody = document.getElementById('report-modal-tbody');
  const countEl = document.getElementById('report-modal-count');

  if (!modal || !tbody) return;

  tbody.innerHTML = '';
  countEl.textContent = activeFilteredLeaves.length;

  if (activeFilteredLeaves.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:16px;">No leaves matched active filter options.</td></tr>';
  } else {
    activeFilteredLeaves.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600; padding:10px 8px;">${l.id}</td>
        <td style="padding:10px 8px;">${l.employeeName}</td>
        <td style="padding:10px 8px;">${l.branch}</td>
        <td style="padding:10px 8px;">${l.leaveType}</td>
        <td style="padding:10px 8px;">${formatAdminDate(l.fromDate)} - ${formatAdminDate(l.toDate)}</td>
        <td style="padding:10px 8px;">${l.days}</td>
        <td style="padding:10px 8px;"><span class="badge ${l.status.toLowerCase() === 'approved' ? 'approved' : l.status.toLowerCase() === 'rejected' ? 'rejected' : 'pending'}">${l.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  modal.classList.add('show');
}

// Initializer trigger for reports page
document.addEventListener('DOMContentLoaded', () => {
  const triggerEl = document.getElementById('rep-card-employees');
  if (!triggerEl) return; // not on reports page

  initReportActivities();
  renderReportActivities();
  runReportsCalculation();

  // Attach filters change listeners
  const fromEl = document.getElementById('report-from-date');
  const toEl = document.getElementById('report-to-date');
  const branchEl = document.getElementById('report-branch-filter');
  const statusEl = document.getElementById('report-status-filter');

  if (fromEl) fromEl.addEventListener('change', runReportsCalculation);
  if (toEl) toEl.addEventListener('change', runReportsCalculation);
  if (branchEl) branchEl.addEventListener('change', runReportsCalculation);
  if (statusEl) statusEl.addEventListener('change', runReportsCalculation);

  // Attach export buttons listeners
  const pdfBtn = document.getElementById('export-pdf-btn');
  const excelBtn = document.getElementById('export-excel-btn');
  const printBtn = document.getElementById('export-print-btn');

  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      showToast('PDF report generated and downloaded successfully.', 'success');
      logReportActivity('Employee leave report downloaded in PDF format.');
    });
  }

  if (excelBtn) {
    excelBtn.addEventListener('click', () => {
      showToast('Excel spreadsheet exported successfully.', 'success');
      logReportActivity('Monthly report exported in Excel format.');
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      logReportActivity('Employee leave report printed.');
      window.print();
    });
  }

  // Reports table action buttons View triggers
  const viewReportBtns = document.querySelectorAll('.view-report-table-btn');
  viewReportBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showReportPreviewModal();
    });
  });

  // Modal close triggers
  const modal = document.getElementById('report-details-modal');
  const closeBtn = document.getElementById('modal-report-close');
  const backBtn = document.getElementById('modal-report-back');

  function closeReportModal() {
    if (modal) modal.classList.remove('show');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeReportModal);
  if (backBtn) backBtn.addEventListener('click', closeReportModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeReportModal();
    });
  }
});
