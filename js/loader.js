// ============================================
// LOADING OVERLAY CONTROLLER
// ============================================

class LoadingOverlay {
  constructor() {
    this.overlay = null;
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    // Create overlay element if it doesn't exist
    if (!document.querySelector('.loading-overlay')) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'loading-overlay';
      this.overlay.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">Carregando...</div>
      `;
      
      // Ensure body exists before appending
      if (document.body) {
        document.body.appendChild(this.overlay);
      } else {
        console.warn('LoadingOverlay: document.body not available yet');
      }
    } else {
      this.overlay = document.querySelector('.loading-overlay');
    }
  }

  show(text = 'Carregando...') {
    if (this.overlay) {
      const loadingText = this.overlay.querySelector('.loading-text');
      if (loadingText) loadingText.textContent = text;
      this.overlay.classList.remove('hidden');
    }
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.add('hidden');
    }
  }

  setText(text) {
    if (this.overlay) {
      const loadingText = this.overlay.querySelector('.loading-text');
      if (loadingText) loadingText.textContent = text;
    }
  }
}

// Global instance - only create if not already exists
if (typeof loader === 'undefined') {
  var loader = new LoadingOverlay();
}

// Auto-hide after page load
window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof loader !== 'undefined') {
      loader.hide();
    }
  }, 300);
});

// Show loader on page navigation
window.addEventListener('beforeunload', () => {
  if (typeof loader !== 'undefined') {
    loader.show('Carregando...');
  }
});
