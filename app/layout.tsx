import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Video — Agentic Video Studio',
  description:
    'Create cinematic AI videos with agentic routing, quota-aware provider selection, continuity, lip sync and quality control.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
