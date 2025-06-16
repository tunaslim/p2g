'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Order {
  id: string;
  // Add your order fields here
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('helmToken');
    if (!token) {
      setError('Not logged in');
      return;
    }

    async function fetchOrders() {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`/api/helm/orders?token=${token}`);
        setOrders(response.data.orders || response.data); // adjust based on response shape
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (orders.length === 0) return <p>No orders found.</p>;

  return (
    <main>
      <h1>Your Orders</h1>
      <ul>
        {orders.map(order => (
          <li key={order.id}>{/* render order info here */}Order ID: {order.id}</li>
        ))}
      </ul>
    </main>
  );
}
