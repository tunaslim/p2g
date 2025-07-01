"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function BookOrderPreviewClient() {
  const params = useSearchParams();
  const raw = params.get('order') || '';
  const [order, setOrder] = useState<any>(null);
  /* …rest of your client-only code… */
}
