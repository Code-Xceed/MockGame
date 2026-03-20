import type { ReactNode } from 'react';

type PanelProps = {
  title: string;
  children: ReactNode;
};

export function Panel({ title, children }: PanelProps) {
  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}
