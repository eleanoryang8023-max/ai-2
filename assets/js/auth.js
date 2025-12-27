// Check if user is authenticated
async function checkAuth() {
  const token = window.api.getToken();
  if (!token) {
    return null;
  }

  try {
    const user = await window.api.auth.getMe();
    return user;
  } catch (error) {
    window.api.removeToken();
    return null;
  }
}

// Get current user
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// Clear current user
function clearCurrentUser() {
  localStorage.removeItem('user');
}

// Update navigation based on auth status
async function updateNavigation() {
  const user = await checkAuth();
  const navLinks = document.querySelector('.nav-links');
  
  if (!navLinks) return;

  // Clear existing user menu items
  const userMenuItems = navLinks.querySelectorAll('.user-menu-item');
  userMenuItems.forEach(item => item.remove());

  if (user) {
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    
    const userName = document.createElement('span');
    userName.textContent = user.username;
    
    const profileLink = document.createElement('a');
    profileLink.href = 'profile.html';
    profileLink.textContent = '个人中心';
    
    const adminLink = document.createElement('a');
    if (user.role === 'admin') {
      adminLink.href = 'admin.html';
      adminLink.textContent = '管理后台';
      userMenu.appendChild(adminLink);
    }
    
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-outline';
    logoutBtn.textContent = '登出';
    logoutBtn.onclick = async () => {
      await window.api.auth.logout();
      clearCurrentUser();
      window.location.href = 'index.html';
    };
    
    userMenu.appendChild(profileLink);
    userMenu.appendChild(logoutBtn);
    
    const li = document.createElement('li');
    li.className = 'user-menu-item';
    li.appendChild(userName);
    li.appendChild(userMenu);
    
    navLinks.appendChild(li);
  } else {
    const loginLink = document.createElement('a');
    loginLink.href = 'login.html';
    loginLink.textContent = '登录';
    loginLink.className = 'btn btn-outline';
    
    const registerLink = document.createElement('a');
    registerLink.href = 'register.html';
    registerLink.textContent = '注册';
    registerLink.className = 'btn btn-primary';
    
    const li = document.createElement('li');
    li.className = 'user-menu-item';
    li.appendChild(loginLink);
    li.appendChild(registerLink);
    
    navLinks.appendChild(li);
  }
}

// Require authentication
async function requireAuth() {
  const user = await checkAuth();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// Require admin
async function requireAdmin() {
  const user = await requireAuth();
  if (user && user.role !== 'admin') {
    alert('需要管理员权限');
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

// Export
window.auth = {
  checkAuth,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  updateNavigation,
  requireAuth,
  requireAdmin
};

// Update navigation on page load
document.addEventListener('DOMContentLoaded', () => {
  updateNavigation();
});
