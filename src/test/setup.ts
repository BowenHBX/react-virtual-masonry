import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

class MockResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    let width = 0;
    let height = 0;
    const el = target as HTMLElement;

    if (el.classList.contains('rvm-root')) {
      width = 360;
      height = 600;
    } else if (el.dataset.masonryKey) {
      const customHeight = Number(el.dataset.testHeight || el.firstElementChild?.getAttribute('data-height') || 160);
      width = 172;
      height = Number.isFinite(customHeight) ? customHeight : 160;
    }

    const entry = {
      target,
      contentRect: {
        width,
        height,
        top: 0,
        left: 0,
        bottom: height,
        right: width,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRectReadOnly,
    } as ResizeObserverEntry;

    this.callback([entry], this as unknown as ResizeObserver);
  }

  unobserve() {}

  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
  cb(performance.now());
  return 1;
});

vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
