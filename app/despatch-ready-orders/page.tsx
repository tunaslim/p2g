'use client';
import { useEffect, useState } from 'react';
import styles from '../page.module.css';
import axios from 'axios';
import { useToken } from '../context/TokenContext';

export default function DespatchReadyOrders() {
  const { token } = useToken();
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchOrders = async () => {
      try {
        const response = await axios.get('https://goodlife.myhelm.app/public-api/orders/despatch-ready', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setOrders(response.data.orders || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch orders');
      }
    };

    fetchOrders();
  }, [token]);

  return (
    <div className={styles.main}>
      <h1 className={styles.title}>Despatch Ready Orders</h1>

      {error && <p className={styles.error}>{error}</p>}

      {!error && orders.length === 0 && (
        <p className={styles.subTitle}>No despatch-ready orders found.</p>
      )}

      {orders.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer_name || 'N/A'}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
