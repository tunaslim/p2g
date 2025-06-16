'use client';

import { useEffect, useState } from 'react';

interface Order {
  id: string;
  reference: string;
  customer_name: string;
  // Add other fields as needed
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      const token = localStorage.getItem('helm_token');
      if (!token) {
        setError('No token found. Please login.');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/helm/orders?token=${token}`);
        if (!response.ok) throw new Error('Failed to fetch orders');

        const data = await response.json();
        setOrders(data.orders);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  return (
    <main>
      <h1>Orders</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {orders.length > 0 && (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              {order.reference} - {order.customer_name}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
