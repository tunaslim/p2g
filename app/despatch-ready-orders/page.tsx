'use client';
import { useEffect, useState } from 'react';
import styles from '../page.module.css';
import axios from 'axios';
import { useToken } from '../context/TokenContext';

interface Order {
  inventory: {
    sku: string;
    quantity: number;
    name: string;
    unit_price: string;
    unit_tax: string;
    line_total_discount: string;
    price: string;
    options: string;
    hs_code: string | null;
    country_of_origin: string | null;
    customs_description: string | null;
  }[];
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
  access_url: string;
  status_description: string;
  channel_alt_id: string;
  sale_type: string;
  total_tax: string;
  shipping_paid: string;
  total_discount: string;
  order_discount: string;
  total_paid: string;
}

export default function DespatchReadyOrders() {
  const { token } = useToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  const getChannelLogo = (channel_id: number): string => {
  switch (channel_id) {
    case 1:
      return '/logos/amazon.png'; // Must be public/logos/amazon.png
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
    IL: 'ISR',
    BE: 'BEL',
  };

  const truncateEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    if (email.length <= 25) return email;
    return `${localPart.slice(0, 5)}[...]${localPart.slice(-5)}@${domain}`;
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
                <th>Item Details</th>
                <th className={styles.totalColumn}>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className={styles.orderCell}>
                      <div>
                        <img
        src={getChannelLogo(order.channel_id)}
        alt="Channel Logo"
        className={styles.logo}
        style={{ display: 'block', margin: '0 auto 5px' }}
      />
                      </div>
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
                      <div>{truncateEmail(order.email)}</div>
                      <div>{order.shipping_address_line_one}</div>
                      <div>{order.shipping_address_line_two}</div>
                      <div>{order.shipping_address_city}</div>
                      <div>{order.shipping_address_postcode}</div>
                      <div>{iso2to3[order.shipping_address_iso] || order.shipping_address_iso}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.orderCell}>
                      {order.inventory.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '8px' }}>
                          <div><strong>{item.name}</strong> (x{item.quantity})</div>
                          <div>SKU: {item.sku}</div>
                          <div>Price: £{item.price}</div>
                          <div>Tax: £{item.unit_tax}</div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className={styles.totalColumn}>
                    <div className={styles.orderCell}>
                      <div>Total Tax: £{order.total_tax}</div>
                      <div>Shipping: £{order.shipping_paid}</div>
                      <div>Total Discount: £{order.total_discount}</div>
                      <div>Order Discount: £{order.order_discount}</div>
                      <div>Total Paid: £{order.total_paid}</div>
                    </div>
                  </td>
                  <td>
                    <a
  href={order.access_url}
  target="_blank"
  rel="noopener noreferrer"
  className={styles.selectButton}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
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
