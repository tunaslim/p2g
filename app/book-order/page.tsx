"use client";

import BookOrderPreviewClient from './client/BookOrderPreviewClient';

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

export default function Page() {
  return <BookOrderPreviewClient />;
}
