'use client';
import { useEffect, useState } from 'react';
import styles from '../page.module.css';
import axios from 'axios';
import { useToken } from '../context/TokenContext';

interface Order {
  id: number;
  channel_id: number;
  channel_order_id: string;
  shipping_name: string;
  shipping_address_line_one: string;
  shipping_address_city: string;
  shipping_address_postcode: string;
  status: string;
  access_url: string;
}

export default function DespatchReadyOrders() {
  const { token } = useToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  const getChannelLogo = (channel_id: number) => {
    switch (channel_id) {
      case 1:
        return '/logos/amazon.png';
      case 2:
        return '/logos/ebay.png';
      case 7:
        return '/logos/shopify.png';
      default:
        return '/logos/default.png';
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchOrders = async () => {
      try {
        const response = await axios.get('/api/helm-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Helm-Filter': 'status[]=3',
          },
        });
        setOrders(response.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch orders');
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
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Postcode</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <img
                      src={getChannelLogo(order.channel_id)}
                      alt="Channel Logo"
                      className={styles.logo}
                    />
                  </td>
                  <td>{order.channel_order_id}</td>
                  <td>{order.shipping_name}</td>
                  <td>
                    {order.shipping_address_line_one}, {order.shipping_address_city}
                  </td>
                  <td>{order.shipping_address_postcode}</td>
                  <td>{order.status}</td>
                  <td>
                    <a
                      href={order.access_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.selectButton}
                    >
                      View on sales channel
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
