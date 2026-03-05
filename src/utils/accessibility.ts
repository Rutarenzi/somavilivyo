
// Accessibility utilities for course learning interface
import { RefObject } from 'react';

export interface AccessibilityOptions {
  announceChanges?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
}

export class AccessibilityManager {
  private options: AccessibilityOptions;
  private announcer: HTMLElement | null = null;

  constructor(options: AccessibilityOptions = {}) {
    this.options = {
      announceChanges: true,
      focusManagement: true,
      keyboardNavigation: true,
      ...options
    };
    this.initializeAnnouncer();
  }

  private initializeAnnouncer() {
    if (this.options.announceChanges && typeof document !== 'undefined') {
      this.announcer = document.createElement('div');
      this.announcer.setAttribute('aria-live', 'polite');
      this.announcer.setAttribute('aria-atomic', 'true');
      this.announcer.className = 'sr-only';
      this.announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(this.announcer);
    }
  }

  announce(message: string) {
    if (this.announcer && this.options.announceChanges) {
      this.announcer.textContent = message;
    }
  }

  focusElement(element: HTMLElement | RefObject<HTMLElement>) {
    if (!this.options.focusManagement) return;
    
    const target = 'current' in element ? element.current : element;
    if (target) {
      target.focus();
    }
  }

  setupKeyboardNavigation(container: HTMLElement) {
    if (!this.options.keyboardNavigation) return;

    container.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.handleTabNavigation(event);
      } else if (event.key === 'Escape') {
        this.handleEscapeKey(event);
      }
    });
  }

  private handleTabNavigation(event: KeyboardEvent) {
    const focusableElements = this.getFocusableElements(event.currentTarget as HTMLElement);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }

  private handleEscapeKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const modal = target.closest('[role="dialog"]');
    if (modal) {
      const closeButton = modal.querySelector('[aria-label="Close"]') as HTMLElement;
      closeButton?.click();
    }
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }

  cleanup() {
    if (this.announcer && document.body.contains(this.announcer)) {
      document.body.removeChild(this.announcer);
    }
  }
}

export const createAccessibilityManager = (options?: AccessibilityOptions) => {
  return new AccessibilityManager(options);
};
