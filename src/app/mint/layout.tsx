import Link from 'next/link';

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Removed the redundant <nav> wrapper for studio layout */}
      {children}
    </>
  );
} 