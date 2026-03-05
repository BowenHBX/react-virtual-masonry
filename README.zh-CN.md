# react-virtual-masonry

[English](./README.md)

一个面向 React 的高性能虚拟瀑布流组件。

适用于「长列表 + 分页追加 + 卡片高度不固定」的场景，重点解决滚动卡顿和布局抖动问题。

## 特性

- 支持虚拟渲染（windowing + overscan）。
- 支持不等高卡片（基于 `ResizeObserver` 实时测量）。
- 支持分页追加时的增量布局。
- 卡片高度变化时优先局部重排，尽量避免全量重排。
- 快速滑动兜底，降低短暂白屏概率。
- 同时支持 window 滚动和自定义滚动容器。

## 安装

```bash
npm install react-virtual-masonry
```

## 快速使用

```tsx
import { VirtualMasonry } from 'react-virtual-masonry';

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

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `items` | `T[]` | - | 列表数据源。 |
| `column` | `number` | - | 列数。 |
| `gap` | `number` | `7` | 列间距和卡片间距（px）。 |
| `overscan` | `number` | `900` | 可视区上下额外渲染距离（px）。 |
| `estimateHeight` | `number` | `320` | 首次测量前的预估高度（px）。 |
| `className` | `string` | - | 根容器类名。 |
| `itemClassName` | `string` | - | 卡片外层类名。 |
| `getItemKey` | `(item: T, index: number) => string` | - | 稳定且唯一的 key（必填）。 |
| `getItemId` | `(item: T, index: number) => string \| undefined` | - | 卡片外层可选 id。 |
| `renderItem` | `({ item, index }) => ReactNode` | - | 卡片渲染函数（必填）。 |
| `scrollContainer` | `string \| HTMLElement \| null \| (() => HTMLElement \| null)` | `'.taro_page' -> window` | 自定义滚动容器。 |
| `minScrollDelta` | `number` | `8` | 触发可视区更新的最小滚动位移。 |

## 滚动容器示例

使用默认逻辑（优先 `.taro_page`，否则 window）：

```tsx
<VirtualMasonry {...props} />
```

使用选择器：

```tsx
<VirtualMasonry {...props} scrollContainer=".my-scroll-container" />
```

使用 DOM 节点：

```tsx
<VirtualMasonry {...props} scrollContainer={containerRef.current} />
```

使用函数返回节点：

```tsx
<VirtualMasonry {...props} scrollContainer={() => document.getElementById('scroll-root')} />
```

## 性能建议

- `getItemKey` 必须稳定且唯一（推荐使用后端 id）。
- `estimateHeight` 尽量贴近卡片平均高度，减少首屏重排。
- 根据场景调优 `overscan`：
  - 大：快速滑动更稳，但 DOM 更多；
  - 小：DOM 更少，但可能更容易出现“补渲染感”。
- 复杂卡片建议配合 `React.memo`。
- 避免在 `renderItem` 中执行高开销计算。

## 本地构建（贡献者）

```bash
npm install
npm run typecheck
npm run build
```

## License

MIT
