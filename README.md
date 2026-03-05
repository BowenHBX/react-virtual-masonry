# react-virtual-masonry

A virtualized masonry layout component for React.

## Features

- Supports variable-height cards.
- Virtual rendering for large lists.
- Incremental layout for append-only pagination.
- `ResizeObserver`-based height measurement and local relayout.
- Fast-scroll fallback to avoid temporary blank area.

## Installation

```bash
npm install react-virtual-masonry
```

## Basic Usage

```tsx
import { VirtualMasonry } from 'react-virtual-masonry';

type Item = { id: string; title: string };

export default function Demo({ items }: { items: Item[] }) {
  return (
    <VirtualMasonry
      items={items}
      column={2}
      gap={8}
      overscan={900}
      estimateHeight={320}
      getItemKey={(item) => item.id}
      renderItem={({ item }) => (
        <div style={{ padding: 12, background: '#fff', borderRadius: 12 }}>
          {item.title}
        </div>
      )}
    />
  );
}
```

## Props

- `items: T[]` list data.
- `column: number` number of columns.
- `gap?: number` gap between columns and cards. Default `7`.
- `overscan?: number` extra rendering range above and below viewport. Default `900`.
- `estimateHeight?: number` fallback item height before measured. Default `320`.
- `className?: string` root class name.
- `itemClassName?: string` item wrapper class name.
- `getItemKey: (item, index) => string` stable key extractor.
- `getItemId?: (item, index) => string | undefined` optional id extractor.
- `renderItem: ({ item, index }) => React.ReactNode` item renderer.
- `scrollContainer?: string | HTMLElement | null | (() => HTMLElement | null)` scroll container.  
  - If omitted, it tries `.taro_page` first, then falls back to window scrolling.
- `minScrollDelta?: number` minimal scroll delta to trigger visible-window update. Default `8`.

## Build

```bash
npm install
npm run build
```

## License

MIT
