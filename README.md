# react-virtual-masonry

[中文文档](./README.zh-CN.md)

A performant virtualized masonry (waterfall) component for React.

It is designed for long, append-only feeds with variable-height cards, where you need both smooth scrolling and stable layout updates.

## Features

- Virtual rendering for large datasets (windowing + overscan).
- Variable-height items powered by `ResizeObserver`.
- Incremental relayout for append-only pagination.
- Local relayout for measured height changes (avoid full reflow whenever possible).
- Fast-scroll fallback to avoid temporary blank areas.
- Works with window scrolling and custom scroll containers.

## Installation

```bash
npm install @bowen/react-virtual-masonry
```

## Quick Start

```tsx
import { VirtualMasonry } from '@bowen/react-virtual-masonry';

type Item = { id: string; title: string; cover: string };

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
        <article style={{ padding: 12, background: '#fff', borderRadius: 12 }}>
          <img src={item.cover} alt="" style={{ width: '100%', borderRadius: 8 }} />
          <h4>{item.title}</h4>
        </article>
      )}
    />
  );
}
```

## API

### `VirtualMasonryProps<T>`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `T[]` | - | List data source. |
| `column` | `number` | - | Number of columns. |
| `gap` | `number` | `7` | Gap between columns/items (px). |
| `overscan` | `number` | `900` | Extra render range above and below viewport (px). |
| `estimateHeight` | `number` | `320` | Fallback item height before first measurement (px). |
| `className` | `string` | - | Root container class name. |
| `itemClassName` | `string` | - | Per-item wrapper class name. |
| `getItemKey` | `(item: T, index: number) => string` | - | Stable key extractor (required). |
| `getItemId` | `(item: T, index: number) => string \| undefined` | - | Optional id extractor for item wrapper. |
| `renderItem` | `({ item, index }) => ReactNode` | - | Item renderer (required). |
| `scrollContainer` | `string \| HTMLElement \| null \| (() => HTMLElement \| null)` | `'.taro_page' -> window` | Custom scroll container selector or node. |
| `minScrollDelta` | `number` | `8` | Minimal scroll delta that triggers visible-range update. |

## Scroll Container Examples

Use default (tries `.taro_page`, then falls back to window):

```tsx
<VirtualMasonry {...props} />
```

Use a custom selector:

```tsx
<VirtualMasonry {...props} scrollContainer=".my-scroll-container" />
```

Use an element:

```tsx
<VirtualMasonry {...props} scrollContainer={containerRef.current} />
```

Use a getter function:

```tsx
<VirtualMasonry {...props} scrollContainer={() => document.getElementById('scroll-root')} />
```

## Performance Tips

- Keep `getItemKey` stable and unique (recommended: backend id).
- Use `estimateHeight` close to real average item height.
- Tune `overscan`:
  - larger -> smoother fast scroll, more DOM nodes
  - smaller -> fewer nodes, potentially more pop-in
- Wrap heavy card components with `React.memo` when possible.
- Avoid expensive inline computations inside `renderItem`.

## Build (for contributors)

```bash
npm install
npm run typecheck
npm run test
npm run build
```

## Run Demo

```bash
npm install
npm run demo
```

Build demo static assets:

```bash
npm run demo:build
```

## Test

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

## License

MIT
