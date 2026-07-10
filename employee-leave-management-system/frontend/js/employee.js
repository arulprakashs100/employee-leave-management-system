/* Employee dashboard scripting engine: employee.js */

const DB_LEAVES_KEY = 'lms_leaves_auth';

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

// 1. Calculate dashboard metrics
function renderEmployeeMetrics(myLeaves) {
  const totalLeaves = myLeaves.length;

  const now = new Date();
  
  // Applied this calendar week (last 7 days)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const leavesThisWeek = myLeaves.filter(l => {
    const appDate = new Date(l.appliedDate);
    return appDate >= oneWeekAgo;
  }).length;

  // Applied this calendar month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const leavesThisMonth = myLeaves.filter(l => {
    const appDate = new Date(l.appliedDate);
    return appDate >= startOfMonth;
  }).length;

  // Cancelled or Rejected
  const cancelledOrRejected = myLeaves.filter(l => 
    l.status.toLowerCase() === 'rejected' || l.status.toLowerCase() === 'cancelled'
  ).length;

  // Write elements
  const elTotal = document.getElementById('stat-total');
  const elWeek = document.getElementById('stat-week');
  const elMonth = document.getElementById('stat-month');
  const elBad = document.getElementById('stat-bad');

  if (elTotal) elTotal.textContent = totalLeaves;
  if (elWeek) elWeek.textContent = leavesThisWeek;
  if (elMonth) elMonth.textContent = leavesThisMonth;
  if (elBad) elBad.textContent = cancelledOrRejected;
}

// 2. Populate Recent requests table
function renderRecentRequestsTable(myLeaves) {
  const tbody = document.getElementById('recent-leaves-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (myLeaves.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-table-state">
            <i class="fa-solid fa-folder-open"></i>
            <p>No recent leave requests found.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Sort by applied date descending, show top 5
  const recent = [...myLeaves]
    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
    .slice(0, 5);

  recent.forEach(l => {
    const tr = document.createElement('tr');
    
    let badgeClass = 'pending';
    if (l.status.toLowerCase() === 'approved') badgeClass = 'approved';
    if (l.status.toLowerCase() === 'rejected') badgeClass = 'rejected';

    tr.innerHTML = `
      <td style="font-weight: 600;">${l.leaveType}</td>
      <td>${formatDateString(l.fromDate)}</td>
      <td>${formatDateString(l.toDate)}</td>
      <td>${l.days} ${l.days === 1 ? 'Day' : 'Days'}</td>
      <td><span class="badge ${badgeClass}">${l.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// 3. Render Notifications panel list
function renderNotificationsPanel(myLeaves) {
  const list = document.getElementById('notif-list');
  const badge = document.getElementById('notif-badge');
  if (!list) return;

  list.innerHTML = '';

  if (myLeaves.length === 0) {
    list.innerHTML = '<li class="notif-empty">No updates.</li>';
    if (badge) badge.style.display = 'none';
    return;
  }

  // Generate mock notification alerts based on leaves state
  const updates = [];
  
  // Sort leaves by date applied descending
  const sorted = [...myLeaves].sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

  sorted.forEach(l => {
    let text = '';
    let icon = '';
    let itemClass = '';

    if (l.status.toLowerCase() === 'approved') {
      text = `Your ${l.leaveType} request from ${formatDateString(l.fromDate)} has been approved.`;
      icon = 'fa-circle-check';
      itemClass = 'approved';
    } else if (l.status.toLowerCase() === 'rejected') {
      text = `Your ${l.leaveType} request from ${formatDateString(l.fromDate)} has been rejected.`;
      icon = 'fa-circle-xmark';
      itemClass = 'rejected';
    } else {
      text = `New ${l.leaveType} request submitted successfully.`;
      icon = 'fa-hourglass-half';
      itemClass = 'pending';
    }

    updates.push({ text, icon, itemClass });
  });

  if (badge) {
    badge.style.display = updates.length > 0 ? 'block' : 'none';
  }

  updates.slice(0, 4).forEach(item => {
    const li = document.createElement('li');
    li.className = `notif-item ${item.itemClass}`;
    li.innerHTML = `
      <i class="fa-solid ${item.icon}"></i>
      <div>${item.text}</div>
    `;
    list.appendChild(li);
  });
}

// 4. Load page parameters
document.addEventListener('DOMContentLoaded', async () => {
  const session = JSON.parse(localStorage.getItem('lms_session_auth'));
  if (!session || session.role !== 'employee') return;

  // Welcoming Employee
  const nameEl = document.getElementById('employee-display-name');
  if (nameEl) nameEl.textContent = session.name;

  try {
    showLoader(800);
    const res = await fetch(`http://localhost:8080/api/leaves/employee/${session.id}`);
    const data = await res.json();
    
    if (data.success) {
      const myLeaves = data.data;
      // Cache it back to localStorage for other simple sync components if needed
      const allLeaves = JSON.parse(localStorage.getItem(DB_LEAVES_KEY)) || [];
      const others = allLeaves.filter(l => l.employeeId !== session.id);
      localStorage.setItem(DB_LEAVES_KEY, JSON.stringify([...others, ...myLeaves]));

      // Render components
      renderEmployeeMetrics(myLeaves);
      renderRecentRequestsTable(myLeaves);
      renderNotificationsPanel(myLeaves);
    }
  } catch (error) {
    console.error(error);
    showToast('Failed to load employee dashboard data from server', 'error');
  }
});
