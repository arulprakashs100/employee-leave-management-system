/* Shared Dashboard Layout scripts: dashboard.js */

// Fast Theme Loader check (applied immediately)
(function() {
  const theme = localStorage.getItem('lms_theme_pref');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-theme');
    // Also apply to body if available
    document.addEventListener('DOMContentLoaded', () => {
      document.body.classList.add('dark-theme');
    });
  }
})();

const SESSION_KEY = 'lms_session_auth';

// 1. Guard check routing on load
function checkAuthGuard() {
  const session = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

// 2. Clear Session and log out
function handleLogout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'login.html';
}

// 3. Document Load triggers
document.addEventListener('DOMContentLoaded', () => {
  const activeSession = checkAuthGuard();
  if (!activeSession) return;

  // Toggle Dropdowns
  const profileTrigger = document.getElementById('profile-trigger');
  const profileMenu = document.getElementById('profile-menu');
  const notifTrigger = document.getElementById('notif-trigger');
  const notifPanel = document.getElementById('notif-panel');

  if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('show');
      if (notifPanel) notifPanel.classList.remove('show');
    });
  }

  if (notifTrigger && notifPanel) {
    notifTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.classList.toggle('show');
      if (profileMenu) profileMenu.classList.remove('show');
    });
  }

  // Close dropdowns on document click
  document.addEventListener('click', () => {
    if (profileMenu) profileMenu.classList.remove('show');
    if (notifPanel) notifPanel.classList.remove('show');
  });

  // Logout triggers with confirmation
  const logoutBtns = document.querySelectorAll('.logout-trigger');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
        handleLogout();
      }
    });
  });
});
