import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Mabrig Verse — AI Music Video Creator', description: 'Turn music and reference images into cinematic music video storyboards.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}