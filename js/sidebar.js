// ============================================
// SIDEBAR MOBILE CONTROL
// ============================================

class SidebarController {
  constructor() {
    this.sidebar = null;
    this.toggleBtn = null;
    this.overlay = null;
    this.isOpen = false;
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.sidebar = document.querySelector('.sidebar');
    this.toggleBtn = document.querySelector('.mobile-menu-toggle');
    this.overlay = document.querySelector('.sidebar-overlay');

    if (!this.sidebar) {
      console.warn('SidebarController: .sidebar not found');
      return;
    }

    this.createToggleButton();
    this.createOverlay();
    this.attachEventListeners();
    this.setActiveMenuItem();
  }

  createToggleButton() {
    if (this.toggleBtn) return;

    this.toggleBtn = document.createElement('button');
    this.toggleBtn.className = 'mobile-menu-toggle';
    this.toggleBtn.setAttribute('aria-label', 'Toggle menu');
    this.toggleBtn.innerHTML = `
      <div class="hamburger">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    document.body.appendChild(this.toggleBtn);
  }

  createOverlay() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'sidebar-overlay';
    document.body.appendChild(this.overlay);
  }

  attachEventListeners() {
    // Toggle button click
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }

    // Overlay click
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Close when clicking menu items on mobile
    const menuItems = this.sidebar.querySelectorAll('.menu-btn');
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          setTimeout(() => this.close(), 300);
        }
      });
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768 && this.isOpen) {
          this.close();
        }
      }, 250);
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (!this.sidebar) return;
    
    this.isOpen = true;
    this.sidebar.classList.add('active');
    this.overlay?.classList.add('active');
    this.toggleBtn?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.sidebar) return;
    
    this.isOpen = false;
    this.sidebar.classList.remove('active');
    this.overlay?.classList.remove('active');
    this.toggleBtn?.classList.remove('active');
    document.body.style.overflow = '';
  }

  setActiveMenuItem() {
    const currentPath = window.location.pathname;
    const menuItems = this.sidebar?.querySelectorAll('.menu-btn');
    
    if (!menuItems) return;

    menuItems.forEach(item => {
      const href = item.getAttribute('href');
      if (!href) return;

      // Remove active class from all items first
      item.classList.remove('active');

      // Check if current path matches menu item
      if (currentPath.includes(href.replace('../', ''))) {
        item.classList.add('active');
      }
      
      // Special case for dashboard
      if (currentPath.includes('/dashboard/') && href.includes('/dashboard/')) {
        item.classList.add('active');
      }
    });
  }
}

// Initialize sidebar controller
if (typeof sidebarController === 'undefined') {
  var sidebarController = new SidebarController();
}

// Add smooth scroll behavior
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    // Add smooth scrolling to sidebar
    sidebar.style.scrollBehavior = 'smooth';
  }
});
