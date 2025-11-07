// ============================================
// PATH HELPER - Dynamic path resolution
// ============================================

/**
 * Get the correct relative path to the root based on current location
 * @returns {string} Relative path to root (e.g., '', '../', '../../')
 */
function getPathToRoot() {
  const path = window.location.pathname;
  const segments = path.split('/').filter(s => s);
  
  // Remove the filename if present
  if (segments.length > 0 && segments[segments.length - 1].includes('.html')) {
    segments.pop();
  }
  
  // Check if we're in a nested structure (estabelecimento/dashboard, etc.)
  const nestedFolders = ['estabelecimento', 'profissional', 'cliente'];
  const hasNestedFolder = segments.some(seg => nestedFolders.includes(seg));
  
  if (hasNestedFolder) {
    // We're in a structure like /estabelecimento/dashboard/
    // Count how many levels deep we are after finding the user type folder
    const userTypeIndex = segments.findIndex(seg => nestedFolders.includes(seg));
    const levelsDeep = segments.length - userTypeIndex;
    return '../'.repeat(levelsDeep);
  }
  
  // Default: we're at root level
  return '';
}

/**
 * Get path to login page
 * @returns {string} Path to login.html
 */
function getLoginPath() {
  return getPathToRoot() + 'login.html';
}

/**
 * Get path to a file in the root directory
 * @param {string} filename - Name of the file
 * @returns {string} Path to the file
 */
function getRootPath(filename) {
  return getPathToRoot() + filename;
}

/**
 * Navigate to login page
 */
function goToLogin() {
  window.location.href = getLoginPath();
}

/**
 * Navigate to dashboard based on user role
 * @param {string} role - User role (cliente, profissional, estabelecimento)
 */
function goToDashboard(role) {
  const rootPath = getPathToRoot();
  window.location.href = `${rootPath}${role}/dashboard/`;
}
