
// Testing utilities for course learning components
import { ReactElement } from 'react';

export interface MockCourse {
  id: string;
  title: string;
  description: string;
  topics: any[];
  created_at: string;
  user_id: string;
}

export interface MockModule {
  id: string;
  course_id: string;
  title: string;
  content: string;
  order_index: number;
}

export const createMockCourse = (overrides?: Partial<MockCourse>): MockCourse => {
  return {
    id: 'test-course-1',
    title: 'Test Course',
    description: 'A test course for unit testing',
    topics: [
      {
        title: 'Introduction',
        subtopics: ['Overview', 'Getting Started']
      }
    ],
    created_at: new Date().toISOString(),
    user_id: 'test-user-1',
    ...overrides
  };
};

export const createMockModule = (overrides?: Partial<MockModule>): MockModule => {
  return {
    id: 'test-module-1',
    course_id: 'test-course-1',
    title: 'Test Module',
    content: 'This is test content for the module',
    order_index: 0,
    ...overrides
  };
};

export const createMockModules = (count: number, courseId: string): MockModule[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockModule({
      id: `test-module-${index + 1}`,
      course_id: courseId,
      title: `Module ${index + 1}`,
      order_index: index
    })
  );
};

export const waitForElement = async (
  container: HTMLElement,
  selector: string,
  timeout: number = 5000
): Promise<Element> => {
  return new Promise((resolve, reject) => {
    const element = container.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = container.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
};

export const simulateKeypress = (element: HTMLElement, key: string, options?: KeyboardEventInit) => {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options
  });
  
  element.dispatchEvent(event);
};

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = function(callback: IntersectionObserverCallback) {
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
    };
  };
  
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
  
  return mockIntersectionObserver;
};
