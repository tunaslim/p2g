'use client';

import { useEffect, useState } from 'react';
import { getOrders } from '../../utils/api';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    async function fetchOrders() {
      try {
        const data = await getOrders(token);
        setOrders(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchOrders();
  }, [router]);

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!orders.length) {
    return <p>Loading orders...</p>;
  }

  return (
    <div style={{ maxWidth: 800, margin: 'auto' }}>
      <h2>Orders</h2>
      {orders.map(order => (
        <div key={order.id} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Customer:</strong> {order.customer_name || order.customer?.name || 'N/A'}</p>
          <p><strong>Status:</strong> {order.status}</p>
          {/* Add more order details as needed */}
        </div>
      ))}
    </div>
  );
}
