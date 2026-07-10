/* Leave application logic: leave.js */

const DB_LEAVES_STORE = 'lms_leaves_auth';
const SESSION_STORE = 'lms_session_auth';

// 1. Calculate dates differences
function calculateLeaveDays() {
  const fromEl = document.getElementById('leave-from');
  const toEl = document.getElementById('leave-to');
  const daysEl = document.getElementById('total-days-badge');

  if (!fromEl || !toEl || !daysEl) return 0;

  const fromVal = fromEl.value;
  const toVal = toEl.value;

  if (!fromVal || !toVal) {
    daysEl.textContent = '0 Days';
    daysEl.style.background = 'rgba(0, 0, 0, 0.04)';
    daysEl.style.color = 'var(--text-secondary)';
    return 0;
  }

  const fromDate = new Date(fromVal);
  const toDate = new Date(toVal);

  if (fromDate > toDate) {
    daysEl.textContent = 'Invalid Duration';
    daysEl.style.background = 'var(--danger-bg)';
    daysEl.style.color = 'var(--danger-color)';
    return -1;
  }

  // Calculate inclusive days (e.g. 10 to 11 Jul = 2 Days)
  const diffTime = toDate - fromDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  daysEl.textContent = `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;
  daysEl.style.background = 'rgba(59, 130, 246, 0.1)';
  daysEl.style.color = 'var(--primary-color)';
  return diffDays;
}

// 2. Document loaded triggers
document.addEventListener('DOMContentLoaded', () => {
  const session = JSON.parse(localStorage.getItem(SESSION_STORE));
  if (!session || session.role !== 'employee') return;

  // Auto fill employee info (Read-only)
  const idEl = document.getElementById('emp-id');
  const nameEl = document.getElementById('emp-name');
  const emailEl = document.getElementById('emp-email');
  const branchEl = document.getElementById('emp-branch');

  if (idEl) idEl.value = session.id;
  if (nameEl) nameEl.value = session.name;
  if (emailEl) emailEl.value = session.email;
  if (branchEl) branchEl.value = session.branch;

  // Date change listeners
  const fromEl = document.getElementById('leave-from');
  const toEl = document.getElementById('leave-to');
  
  if (fromEl) fromEl.addEventListener('change', calculateLeaveDays);
  if (toEl) toEl.addEventListener('change', calculateLeaveDays);

  // File Upload listener
  const fileInput = document.getElementById('attachment');
  const fileNameReadout = document.getElementById('file-upload-name');
  
  if (fileInput && fileNameReadout) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileNameReadout.textContent = `Attached: ${file.name} (${Math.round(file.size / 1024)} KB)`;
        fileNameReadout.style.display = 'block';
      } else {
        fileNameReadout.style.display = 'none';
      }
    });
  }

  // Form submits logic
  const form = document.getElementById('leave-apply-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const leaveType = document.getElementById('leave-type').value;
      const fromDate = document.getElementById('leave-from').value;
      const toDate = document.getElementById('leave-to').value;
      const reason = document.getElementById('leave-reason').value.trim();
      const file = fileInput && fileInput.files[0];

      if (!leaveType || !fromDate || !toDate || !reason) {
        showToast('Please fill all required form fields.', 'warning');
        return;
      }

      const totalDays = calculateLeaveDays();
      if (totalDays === -1) {
        showToast('From Date cannot be after To Date.', 'error');
        return;
      }

      // Show confirmation popup before submitting
      const confirmSubmit = window.confirm('Are you sure you want to submit this leave request?');
      if (!confirmSubmit) return;

      const newLeave = {
        employeeId: session.id,
        employeeName: session.name,
        leaveType: leaveType,
        fromDate: fromDate,
        toDate: toDate,
        days: totalDays,
        reason: reason,
        attachment: file ? file.name : null
      };

      showLoader(1000);

      fetch('http://localhost:8080/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('✅ Your leave request has been submitted successfully and is waiting for admin approval.', 'success');
          setTimeout(() => {
            window.location.href = 'leave-status.html';
          }, 950);
        } else {
          showToast('Failed to submit leave request.', 'error');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Backend connection failed', 'error');
      });
    });

    // Reset logic
    form.addEventListener('reset', () => {
      setTimeout(() => {
        calculateLeaveDays();
        if (fileNameReadout) {
          fileNameReadout.style.display = 'none';
          fileNameReadout.textContent = '';
        }
      }, 10);
    });
  }
});

// Format Date helper (e.g. 10 Jul 2026)
function formatDateString(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// --- Leave Status Page functions ---
function renderStatusSummaryCards(myLeaves) {
  const total = myLeaves.length;
  const pending = myLeaves.filter(l => l.status.toLowerCase() === 'pending').length;
  const approved = myLeaves.filter(l => l.status.toLowerCase() === 'approved').length;
  const rejected = myLeaves.filter(l => l.status.toLowerCase() === 'rejected').length;

  const elTotal = document.getElementById('status-card-total');
  const elPending = document.getElementById('status-card-pending');
  const elApproved = document.getElementById('status-card-approved');
  const elRejected = document.getElementById('status-card-rejected');

  if (elTotal) elTotal.textContent = total;
  if (elPending) elPending.textContent = pending;
  if (elApproved) elApproved.textContent = approved;
  if (elRejected) elRejected.textContent = rejected;
}

function renderStatusTable(myLeaves) {
  const tbody = document.getElementById('leave-status-tbody');
  const tableWrapper = document.getElementById('table-wrapper');
  const emptyState = document.getElementById('empty-state-illust');

  if (!tbody) return;

  tbody.innerHTML = '';

  if (myLeaves.length === 0) {
    if (tableWrapper) tableWrapper.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (tableWrapper) tableWrapper.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  myLeaves.forEach(l => {
    const tr = document.createElement('tr');
    let badgeClass = 'pending';
    if (l.status.toLowerCase() === 'approved') badgeClass = 'approved';
    if (l.status.toLowerCase() === 'rejected') badgeClass = 'rejected';

    tr.innerHTML = `
      <td style="font-weight: 600;">${l.id}</td>
      <td>${l.leaveType}</td>
      <td>${formatDateString(l.fromDate)}</td>
      <td>${formatDateString(l.toDate)}</td>
      <td>${l.days} ${l.days === 1 ? 'Day' : 'Days'}</td>
      <td>${formatDateString(l.appliedDate)}</td>
      <td><span class="badge ${badgeClass}">${l.status}</span></td>
      <td>
        <button class="btn btn-secondary view-details-btn" data-id="${l.id}" style="padding:6px 12px; font-size:11px; border-radius:15px;">
          <i class="fa-solid fa-eye"></i> View
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach View button listeners
  tbody.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('button').dataset.id;
      showLeaveDetailsModal(id);
    });
  });
}

let globalMyLeaves = []; // Cache for modal

function showLeaveDetailsModal(leaveId) {
  const leave = globalMyLeaves.find(l => l.id === leaveId);
  if (!leave) return;

  const modal = document.getElementById('details-modal');
  const detailsGrid = document.getElementById('modal-details-grid');
  if (!modal || !detailsGrid) return;

  // Render details values
  detailsGrid.innerHTML = `
    <div class="details-item">
      <span class="details-label">Leave ID</span>
      <span class="details-value">${leave.id}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Applied Date</span>
      <span class="details-value">${formatDateString(leave.appliedDate)}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Employee ID</span>
      <span class="details-value">${leave.employeeId}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Employee Name</span>
      <span class="details-value">${leave.employeeName}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Branch</span>
      <span class="details-value">${leave.branch}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Leave Type</span>
      <span class="details-value">${leave.leaveType}</span>
    </div>
    <div class="details-item">
      <span class="details-label">From Date</span>
      <span class="details-value">${formatDateString(leave.fromDate)}</span>
    </div>
    <div class="details-item">
      <span class="details-label">To Date</span>
      <span class="details-value">${formatDateString(leave.toDate)}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Total Days</span>
      <span class="details-value">${leave.days} ${leave.days === 1 ? 'Day' : 'Days'}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Status</span>
      <span class="details-value"><span class="badge ${leave.status.toLowerCase()}">${leave.status}</span></span>
    </div>
    <div class="details-reason-box">
      <div class="details-label" style="margin-bottom:4px;">Reason for Leave</div>
      <div>${leave.reason}</div>
    </div>
  `;

  // Attach attachment link if present
  if (leave.attachment) {
    const attachBox = document.createElement('div');
    attachBox.className = 'details-reason-box';
    attachBox.innerHTML = `
      <div class="details-label" style="margin-bottom:4px;"><i class="fa-solid fa-paperclip"></i> Attachment</div>
      <a href="#" style="font-size:12px; color:var(--primary-color); font-weight:600; text-decoration:none;"><i class="fa-solid fa-file-pdf"></i> ${leave.attachment}</a>
    `;
    detailsGrid.appendChild(attachBox);
  }

  // Handle Admin decisions
  if (leave.status.toLowerCase() !== 'pending') {
    const adminBox = document.createElement('div');
    adminBox.className = 'admin-decision-box';
    
    if (leave.status.toLowerCase() === 'approved') {
      adminBox.innerHTML = `
        <div class="admin-decision-title approved">
          <i class="fa-solid fa-circle-check"></i> Approved Request
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary);">
          <div><strong>Approved By:</strong> ${leave.approvedBy || 'HR Admin'}</div>
          <div><strong>Approved Date:</strong> ${formatDateString(leave.approvedDate || leave.appliedDate)}</div>
        </div>
      `;
    } else {
      adminBox.innerHTML = `
        <div class="admin-decision-title rejected">
          <i class="fa-solid fa-circle-xmark"></i> Rejected Request
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary); margin-bottom:8px;">
          <div><strong>Rejected By:</strong> ${leave.rejectedBy || 'HR Admin'}</div>
          <div><strong>Rejected Date:</strong> ${formatDateString(leave.rejectedDate || leave.appliedDate)}</div>
        </div>
        <div class="details-reason-box" style="margin-top:0; border-color:rgba(239, 68, 68, 0.15); background:var(--danger-bg); color:var(--danger-color)">
          <div class="details-label" style="color:var(--danger-color); margin-bottom:4px;">Rejection Comments</div>
          <div>${leave.rejectionReason || 'No comments provided.'}</div>
        </div>
      `;
    }
    detailsGrid.appendChild(adminBox);
  }

  modal.classList.add('show');
}

// 5. Load Status logs page components on load
document.addEventListener('DOMContentLoaded', () => {
  const session = JSON.parse(localStorage.getItem(SESSION_STORE));
  if (!session || session.role !== 'employee') return;

  const tbody = document.getElementById('leave-status-tbody');
  if (!tbody) return; // not on leave status page

  fetch(`http://localhost:8080/api/leaves/employee/${session.id}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        globalMyLeaves = data.data; // save to global cache
        renderStatusSummaryCards(globalMyLeaves);
        renderStatusTable(globalMyLeaves);

        // Search input filter
        const searchInput = document.getElementById('status-search');
        const statusFilter = document.getElementById('status-filter');

        function applyFilters() {
          const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
          const status = statusFilter ? statusFilter.value.toLowerCase() : 'all';

          let filtered = globalMyLeaves;

          if (status !== 'all') {
            filtered = filtered.filter(l => l.status.toLowerCase() === status);
          }

          if (q) {
            filtered = filtered.filter(l => 
              l.leaveType.toLowerCase().includes(q) || 
              (l.appliedDate && l.appliedDate.toLowerCase().includes(q))
            );
          }

          renderStatusTable(filtered);
        }

        if (searchInput) searchInput.addEventListener('keyup', applyFilters);
        if (statusFilter) statusFilter.addEventListener('change', applyFilters);
      }
    })
    .catch(err => {
      console.error(err);
      showToast('Failed to load leaves from server', 'error');
    });

  // Modal close trigger
  const modal = document.getElementById('details-modal');
  const closeBtn = document.getElementById('modal-close');
  if (modal && closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });
  }
});
