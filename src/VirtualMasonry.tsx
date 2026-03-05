import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';

interface Position {
  key: string;
  index: number;
  column: number;
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface VirtualMasonryProps<T> {
  items: T[];
  column: number;
  gap?: number;
  overscan?: number;
  estimateHeight?: number;
  className?: string;
  itemClassName?: string;
  getItemKey: (item: T, index: number) => string;
  getItemId?: (item: T, index: number) => string | undefined;
  renderItem: (args: { item: T; index: number }) => React.ReactNode;
  scrollContainer?: string | HTMLElement | null | (() => HTMLElement | null);
  minScrollDelta?: number;
}

const DEFAULT_OVERSCAN = 900;
const DEFAULT_ESTIMATE_HEIGHT = 320;
const DEFAULT_SCROLL_SELECTOR = '.taro_page';
const DEFAULT_MIN_SCROLL_DELTA = 8;

const resolveScrollContainer = (
  scrollContainer?: string | HTMLElement | null | (() => HTMLElement | null)
): HTMLElement | null => {
  if (!scrollContainer) {
    return document.querySelector(DEFAULT_SCROLL_SELECTOR) as HTMLElement | null;
  }

  if (typeof scrollContainer === 'string') {
    return document.querySelector(scrollContainer) as HTMLElement | null;
  }

  if (typeof scrollContainer === 'function') {
    return scrollContainer();
  }

  return scrollContainer;
};

const cx = (...values: Array<string | undefined>) => values.filter(Boolean).join(' ');

function VirtualMasonry<T> (props: VirtualMasonryProps<T>) {
  const {
    items,
    column,
    gap = 7,
    overscan = DEFAULT_OVERSCAN,
    estimateHeight = DEFAULT_ESTIMATE_HEIGHT,
    className,
    itemClassName,
    getItemKey,
    getItemId,
    renderItem,
    scrollContainer,
    minScrollDelta = DEFAULT_MIN_SCROLL_DELTA,
  } = props;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const positionsRef = useRef<Position[]>([]);
  const positionsByTopRef = useRef<Position[]>([]);
  const heightCacheRef = useRef<Map<string, number>>(new Map());
  const keyToIndexRef = useRef<Map<string, number>>(new Map());
  const keysRef = useRef<string[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const observedNodesRef = useRef<Map<string, Element>>(new Map());
  const scrollerRef = useRef<HTMLElement | null>(null);
  const pendingReflowFromIndexRef = useRef<number | null>(null);
  const measureRafRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const scrollTopRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const rootOffsetTopRef = useRef(0);

  const [containerWidth, setContainerWidth] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [rootOffsetTop, setRootOffsetTop] = useState(0);

  const itemWidth = useMemo(() => {
    if (containerWidth <= 0 || column <= 0) return 0;
    return (containerWidth - gap * (column - 1)) / column;
  }, [containerWidth, column, gap]);

  const syncViewport = useCallback(() => {
    const scroller = scrollerRef.current;
    const nextScrollTop = scroller ? scroller.scrollTop : window.scrollY || window.pageYOffset || 0;
    const nextViewportHeight = scroller ? scroller.clientHeight || window.innerHeight : window.innerHeight;

    if (Math.abs(nextScrollTop - scrollTopRef.current) >= minScrollDelta) {
      scrollTopRef.current = nextScrollTop;
      setScrollTop(nextScrollTop);
    }

    if (nextViewportHeight !== viewportHeightRef.current) {
      viewportHeightRef.current = nextViewportHeight;
      setViewportHeight(nextViewportHeight);
    }
  }, [minScrollDelta]);

  const syncRootOffsetTop = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const scroller = scrollerRef.current;
    let nextOffsetTop = 0;

    if (scroller) {
      const rootRect = root.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      nextOffsetTop = rootRect.top - scrollerRect.top + scroller.scrollTop;
    } else {
      const pageScrollTop = window.scrollY || window.pageYOffset || 0;
      const rootRect = root.getBoundingClientRect();
      nextOffsetTop = rootRect.top + pageScrollTop;
    }

    if (Math.abs(nextOffsetTop - rootOffsetTopRef.current) >= 1) {
      rootOffsetTopRef.current = nextOffsetTop;
      setRootOffsetTop(nextOffsetTop);
    }
  }, []);

  const computeLayout = useCallback(
    (fromIndex: number = 0) => {
      if (!items.length || !itemWidth || column <= 0) {
        positionsRef.current = [];
        positionsByTopRef.current = [];
        keyToIndexRef.current = new Map();
        setListHeight(0);
        setLayoutVersion(v => v + 1);
        return;
      }

      const keys = items.map((item, index) => getItemKey(item, index));
      const prevKeys = keysRef.current;
      const prevPositions = positionsRef.current;
      const shouldAppend =
        fromIndex > 0 &&
        prevKeys.length > 0 &&
        prevKeys.length <= keys.length &&
        prevKeys.every((k, i) => keys[i] === k);

      const start = shouldAppend ? fromIndex : 0;
      const nextPositions = shouldAppend ? [...prevPositions] : [];
      const colHeights = new Array(column).fill(0);

      if (shouldAppend && start > 0) {
        for (let i = 0; i < start; i++) {
          const p = prevPositions[i];
          if (!p) continue;
          colHeights[p.column] = Math.max(colHeights[p.column], p.top + p.height + gap);
        }
      }

      for (let i = shouldAppend ? start : 0; i < keys.length; i++) {
        const key = keys[i];
        const cachedHeight = heightCacheRef.current.get(key) ?? estimateHeight;
        let minCol = 0;
        for (let c = 1; c < column; c++) {
          if (colHeights[c] < colHeights[minCol]) minCol = c;
        }
        const top = colHeights[minCol];
        const left = minCol * (itemWidth + gap);
        nextPositions[i] = {
          key,
          index: i,
          column: minCol,
          top,
          left,
          width: itemWidth,
          height: cachedHeight,
        };
        colHeights[minCol] = top + cachedHeight + gap;
      }

      if (!shouldAppend) {
        // fill all slots when recomputing from zero
        for (let i = 0; i < keys.length; i++) {
          if (nextPositions[i]) continue;
          const key = keys[i];
          const cachedHeight = heightCacheRef.current.get(key) ?? estimateHeight;
          let minCol = 0;
          for (let c = 1; c < column; c++) {
            if (colHeights[c] < colHeights[minCol]) minCol = c;
          }
          const top = colHeights[minCol];
          const left = minCol * (itemWidth + gap);
          nextPositions[i] = {
            key,
            index: i,
            column: minCol,
            top,
            left,
            width: itemWidth,
            height: cachedHeight,
          };
          colHeights[minCol] = top + cachedHeight + gap;
        }
      }

      positionsRef.current = nextPositions;
      positionsByTopRef.current = [...nextPositions].sort((a, b) => a.top - b.top);
      keysRef.current = keys;
      keyToIndexRef.current = new Map(keys.map((key, index) => [key, index]));
      const maxHeight = Math.max(...colHeights, 0);
      setListHeight(maxHeight > 0 ? maxHeight - gap : 0);
      setLayoutVersion(v => v + 1);
    },
    [items, itemWidth, column, gap, estimateHeight, getItemKey]
  );

  useEffect(() => {
    if (!rootRef.current) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect?.width ?? 0;
      if (width > 0) setContainerWidth(width);
    });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const nextKeys = items.map((item, index) => getItemKey(item, index));
    const prevKeys = keysRef.current;
    const isAppend =
      prevKeys.length > 0 &&
      prevKeys.length <= nextKeys.length &&
      prevKeys.every((key, index) => nextKeys[index] === key);
    const fromIndex = isAppend ? prevKeys.length : 0;
    computeLayout(fromIndex);
  }, [items, itemWidth, column, computeLayout, getItemKey]);

  useEffect(() => {
    scrollerRef.current = resolveScrollContainer(scrollContainer);

    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        syncViewport();
        rafRef.current = null;
      });
    };

    const handleResize = () => {
      syncRootOffsetTop();
      handleScroll();
    };

    const scroller = scrollerRef.current;
    const target = scroller || window;
    syncRootOffsetTop();
    syncViewport();
    target.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      target.removeEventListener('scroll', handleScroll as EventListener);
      window.removeEventListener('resize', handleResize as EventListener);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [scrollContainer, syncRootOffsetTop, syncViewport]);

  useEffect(() => {
    syncRootOffsetTop();
  }, [layoutVersion, syncRootOffsetTop]);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      let minChangedIndex = Number.MAX_SAFE_INTEGER;
      entries.forEach(entry => {
        const el = entry.target as HTMLElement;
        const key = el.dataset.masonryKey || '';
        if (!key) return;
        const nextHeight = Math.ceil(entry.contentRect.height);
        const prevHeight = heightCacheRef.current.get(key) ?? 0;
        if (Math.abs(prevHeight - nextHeight) >= 1) {
          heightCacheRef.current.set(key, nextHeight);
          const changedIndex = keyToIndexRef.current.get(key);
          if (typeof changedIndex === 'number' && changedIndex < minChangedIndex) {
            minChangedIndex = changedIndex;
          }
        }
      });

      if (minChangedIndex !== Number.MAX_SAFE_INTEGER) {
        const pending = pendingReflowFromIndexRef.current;
        pendingReflowFromIndexRef.current =
          typeof pending === 'number' ? Math.min(pending, minChangedIndex) : minChangedIndex;
        if (measureRafRef.current) return;
        measureRafRef.current = window.requestAnimationFrame(() => {
          const fromIndex = pendingReflowFromIndexRef.current ?? 0;
          pendingReflowFromIndexRef.current = null;
          measureRafRef.current = null;
          computeLayout(fromIndex);
        });
      }
    });

    resizeObserverRef.current = observer;
    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
      if (measureRafRef.current) {
        window.cancelAnimationFrame(measureRafRef.current);
        measureRafRef.current = null;
      }
      pendingReflowFromIndexRef.current = null;
    };
  }, [computeLayout]);

  const visiblePositions = useMemo(() => {
    const localScrollTop = Math.max(0, scrollTop - rootOffsetTop);
    const start = Math.max(0, localScrollTop - overscan);
    const end = localScrollTop + viewportHeight + overscan;
    const sorted = positionsByTopRef.current;
    if (!sorted.length) return [];

    let left = 0;
    let right = sorted.length - 1;
    let begin = 0;
    while (left <= right) {
      const mid = (left + right) >> 1;
      if (sorted[mid].top + sorted[mid].height >= start) {
        begin = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    const result: Position[] = [];
    for (let i = Math.max(0, begin - 8); i < sorted.length; i++) {
      const pos = sorted[i];
      if (pos.top > end) break;
      if (pos.top + pos.height >= start) {
        result.push(pos);
      }
    }

    // fallback for very fast scrolling, avoid blank screen.
    if (result.length === 0 && sorted.length > 0) {
      let nearestIndex = 0;
      for (let i = 0; i < sorted.length; i++) {
        const pos = sorted[i];
        if (pos.top + pos.height >= localScrollTop) {
          nearestIndex = i;
          break;
        }
      }
      return sorted.slice(Math.max(0, nearestIndex - 6), nearestIndex + 14);
    }

    return result;
  }, [scrollTop, rootOffsetTop, viewportHeight, overscan, layoutVersion]);

  const bindMeasureRef = useCallback((key: string, node: HTMLElement | null) => {
    const observer = resizeObserverRef.current;
    if (!observer) return;
    const prev = observedNodesRef.current.get(key);
    if (prev && prev !== node) {
      observer.unobserve(prev);
      observedNodesRef.current.delete(key);
    }
    if (node) {
      observedNodesRef.current.set(key, node);
      observer.observe(node);
    }
  }, []);

  return (
    <div ref={rootRef} className={cx('rvm-root', className)}>
      <div className="rvm-inner" style={{ height: `${listHeight}px` }}>
        {visiblePositions.map(pos => {
          const item = items[pos.index];
          if (typeof item === 'undefined') return null;
          const id = getItemId?.(item, pos.index);
          return (
            <div
              key={pos.key}
              id={id}
              data-masonry-key={pos.key}
              ref={node => bindMeasureRef(pos.key, node)}
              className={cx('rvm-item', itemClassName)}
              style={{
                width: `${pos.width}px`,
                transform: `translate3d(${pos.left}px, ${pos.top}px, 0)`,
              }}
            >
              {renderItem({ item, index: pos.index })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualMasonry;
