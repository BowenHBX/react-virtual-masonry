import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VirtualMasonry from './VirtualMasonry';

interface TestItem {
  id: string;
  title: string;
  height: number;
}

const createItems = (count: number): TestItem[] =>
  Array.from({ length: count }).map((_, index) => ({
    id: `item-${index}`,
    title: `Card ${index}`,
    height: 120 + (index % 5) * 30,
  }));

describe('VirtualMasonry', () => {
  it('renders cards', () => {
    const items = createItems(12);
    render(
      <VirtualMasonry
        items={items}
        column={2}
        getItemKey={(item) => item.id}
        renderItem={({ item }) => <div data-height={item.height}>{item.title}</div>}
      />
    );

    expect(screen.getByText('Card 0')).toBeInTheDocument();
  });

  it('virtualizes long list and does not render all items at once', () => {
    const items = createItems(80);
    render(
      <VirtualMasonry
        items={items}
        column={2}
        overscan={100}
        estimateHeight={160}
        getItemKey={(item) => item.id}
        renderItem={({ item }) => <div data-height={item.height}>{item.title}</div>}
      />
    );

    // first card in viewport
    expect(screen.getByText('Card 0')).toBeInTheDocument();
    // tail card should not be rendered in initial window
    expect(screen.queryByText('Card 79')).not.toBeInTheDocument();
  });

  it('supports append relayout', () => {
    const initialItems = createItems(20);
    const nextItems = createItems(40);
    const { container, rerender } = render(
      <VirtualMasonry
        items={initialItems}
        column={2}
        estimateHeight={160}
        getItemKey={(item) => item.id}
        renderItem={({ item }) => <div data-height={item.height}>{item.title}</div>}
      />
    );

    const initialHeight = Number((container.querySelector('.rvm-inner') as HTMLDivElement).style.height.replace('px', ''));

    rerender(
      <VirtualMasonry
        items={nextItems}
        column={2}
        estimateHeight={160}
        getItemKey={(item) => item.id}
        renderItem={({ item }) => <div data-height={item.height}>{item.title}</div>}
      />
    );

    const nextHeight = Number((container.querySelector('.rvm-inner') as HTMLDivElement).style.height.replace('px', ''));
    expect(nextHeight).toBeGreaterThan(initialHeight);
  });

  it('works with custom scroll container', () => {
    const items = createItems(40);
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'custom-scroll';
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 0, writable: true, configurable: true });
    document.body.appendChild(scrollContainer);

    render(
      <VirtualMasonry
        items={items}
        column={2}
        scrollContainer=".custom-scroll"
        getItemKey={(item) => item.id}
        renderItem={({ item }) => <div data-height={item.height}>{item.title}</div>}
      />
    );

    scrollContainer.scrollTop = 600;
    fireEvent.scroll(scrollContainer);

    expect(screen.getByText('Card 0')).toBeInTheDocument();
    document.body.removeChild(scrollContainer);
  });
});
