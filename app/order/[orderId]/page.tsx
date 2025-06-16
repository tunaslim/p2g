'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('helmToken');
    if (!token) {
      setError('Not logged in');
      return;
    }

    async function fetchOrderDetail() {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`/api/helm/order/${orderId}?token=${token}`);
        setOrder(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load order detail');
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetail();
  }, [orderId]);

  if (loading) return <p>Loading order detail...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!order) return <p>No order found.</p>;

  return (
    <main>
      <h1>Order Detail for {orderId}</h1>
      <pre>{JSON.stringify(order, null, 2)}</pre>
    </main>
  );
}
