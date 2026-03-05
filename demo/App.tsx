import { useMemo, useState } from 'react';
import VirtualMasonry from '../src/VirtualMasonry';

interface DemoItem {
  id: string;
  title: string;
  description: string;
  image: string;
  height: number;
}

const makeItems = (count: number): DemoItem[] =>
  Array.from({ length: count }).map((_, index) => {
    const mod = index % 7;
    const imageHeight = 180 + mod * 24;
    return {
      id: `demo-${index}`,
      title: `Demo Card ${index + 1}`,
      description: `This is a sample card with image and text. Variable height bucket: ${mod}.`,
      image: `https://picsum.photos/seed/masonry-${index}/600/${imageHeight}`,
      height: imageHeight,
    };
  });

export default function App() {
  const [column, setColumn] = useState(2);
  const [gap, setGap] = useState(10);
  const [overscan, setOverscan] = useState(900);
  const [count, setCount] = useState(120);
  const items = useMemo(() => makeItems(count), [count]);

  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>react-virtual-masonry Demo</h1>
        <div className="demo-controls">
          <label>
            Columns
            <input type="number" min={1} max={4} value={column} onChange={(e) => setColumn(Number(e.target.value) || 1)} />
          </label>
          <label>
            Gap
            <input type="number" min={0} max={32} value={gap} onChange={(e) => setGap(Number(e.target.value) || 0)} />
          </label>
          <label>
            Overscan
            <input type="number" min={0} max={3000} value={overscan} onChange={(e) => setOverscan(Number(e.target.value) || 0)} />
          </label>
          <label>
            Count
            <input type="number" min={20} max={500} value={count} onChange={(e) => setCount(Number(e.target.value) || 20)} />
          </label>
        </div>
      </header>

      <VirtualMasonry
        items={items}
        column={column}
        gap={gap}
        overscan={overscan}
        estimateHeight={320}
        className="demo-masonry"
        itemClassName="demo-item"
        getItemKey={(item) => item.id}
        renderItem={({ item }) => (
          <article className="card">
            <img src={item.image} alt={item.title} loading="lazy" />
            <div className="card-body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <small>ImageHeight: {item.height}px</small>
            </div>
          </article>
        )}
      />
    </div>
  );
}
