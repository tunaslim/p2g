'use client';
import { useEffect, useState } from 'react';
import styles from '../page.module.css';
import axios from 'axios';
import { useToken } from '../context/TokenContext';

interface Order {
  shipping_name_company: string | null;
  phone_one: string;
  email: string;
  shipping_address_line_two: string | null;
  id: number;
  channel_id: number;
  channel_order_id: string;
  shipping_name: string;
  shipping_address_line_one: string;
  shipping_address_city: string;
  shipping_address_postcode: string;
  shipping_address_iso: string;
  status: string;
  access_url: string;
  status_description: string;
  channel_alt_id: string;
  sale_type: string;
}

export default function DespatchReadyOrders() {
  const { token } = useToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  const getChannelLogo = (channel_id: number) => {
    switch (channel_id) {
      case 1:
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1206px-Amazon_logo.svg.png?20250504041148';
      case 2:
        return '/logos/ebay.png';
      case 7:
        return '/logos/shopify.png';
      default:
        return '/logos/default.png';
    }
  };

  const iso2to3: Record<string, string> = {
    GB: 'GBR',
    US: 'USA',
    DE: 'DEU',
    FR: 'FRA',
    IT: 'ITA',
    TR: 'TUR',
    ES: 'ESP',
    CA: 'CAN',
    NL: 'NLD',
    // Add more as needed
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
                <th>Order</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Postcode</th>
                <th>Status</th>
                <th>Order</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className={styles.orderCell}>
                      <div><strong>{order.channel_order_id}</strong></div>
                      <div>{order.status_description}</div>
                      <div>{order.channel_alt_id}</div>
                      <div>{order.sale_type}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.orderCell}>
                      <div>{order.shipping_name_company}</div>
                      <div>{order.shipping_name}</div>
                      <div>{order.phone_one}</div>
                      <div>{order.email}</div>
                      <div>{order.shipping_address_line_one}</div>
                      <div>{order.shipping_address_line_two}</div>
                      <div>{order.shipping_address_city}</div>
                      <div>{order.shipping_address_postcode}</div>
                      <div>{iso2to3[order.shipping_address_iso] || order.shipping_address_iso}</div>
                    </div>
                  </td>
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
