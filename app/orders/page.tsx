'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Order {
  order_id: string;
  reference: string;
  status: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('helmToken');
        if (!token) {
          setError('No token found. Please login first.');
          return;
        }

        const response = await axios.get('https://goodlife.myhelm.app/public-api/orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrders(response.data.orders);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred.');
        }
      }
    };

    fetchOrders();
  }, []);

  return (
    <main style={{ padding: '40px' }}>
      <h1>Orders</h1>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {orders.length === 0 && !error && <p>No orders found.</p>}

      {orders.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Order ID</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Reference</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_id}>
                <td style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>{order.order_id}</td>
                <td style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>{order.reference}</td>
                <td style={{ borderBottom: '1px solid #ddd', padding: '8px' }}>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
