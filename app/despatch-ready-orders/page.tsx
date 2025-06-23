'use client';
import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { token } = useToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const iso2to3: Record<string, string> = {
    GB: 'GBR', US: 'USA', DE: 'DEU', FR: 'FRA', IT: 'ITA', TR: 'TUR',
    ES: 'ESP', CA: 'CAN', NL: 'NLD', IL: 'ISR', BE: 'BEL', JP: 'JPN',
  };

  const getChannelLogo = (id: number) => {
    switch (id) {
      case 24: case 15: return '/logos/ebay.png';
      case 27: case 25: case 6: case 2: case 5: case 4: case 3:
        return '/logos/amazon.png';
      case 11: return '/logos/etsy.png';
      case 8: case 7: return '/logos/shopify.png';
      case 26: return '/logos/woocommerce.png';
      default: return '/logos/default.png';
    }
  };

  const getChannelName = (id: number) => {
    switch (id) {
      case 24: return 'Unicorncolors eBay';
      case 15: return 'Colourchanging eBay';
      case 27: return 'Amazon BE';
      case 25: return 'Amazon PL';
      case 6: return 'Amazon UK';
      case 2: return 'Amazon DE';
      case 5: return 'Amazon Spain';
      case 4: return 'Amazon France';
      case 3: return 'Amazon Italy';
      case 11: return 'Etsy Acc';
      case 8: return 'SFXC Shopify';
      case 7: return 'Colour Changing Shopify';
      case 26: return 'Woo Commerce';
      default: return 'Unknown Channel';
    }
  };

  const formatPrice = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(2);
  };

  const truncateEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain || email.length <= 25) return email;
    return `${localPart.slice(0,5)}[...]${localPart.slice(-5)}@${domain}`;
  };

  useEffect(() => {
    if (!token) return;
    const fetchOrders = async () => {
      try {
        const resp = await axios.get<{ total: number; data: Order[] }>('/api/helm-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Helm-Filter': 'status[]=3'
          }
        });
        setOrders(resp.data.data || []);
        setTotal(resp.data.total || 0);
      } catch (e: any) {
        setError(e.response?.data?.error || 'Failed to fetch orders');
      }
    };
    fetchOrders();
  }, [token]);

  return (
    <div className={styles.main}>
      <h1 className={styles.title}>Despatch Ready Orders ({total})</h1>
      {error && <p className={styles.error}>{error}</p>}
      {!error && orders.length === 0 && (
        <p className={styles.subTitle}>No despatch-ready orders found.</p>
      )}
      {orders.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                <th>Order</th>
                <th>Customer</th>
                <th>Item Details</th>
                <th className={styles.totalColumn}>Total</th>
                <th className={styles.actionColumn}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const totalPaid = parseFloat(order.total_paid) || 0;
                const shippingCost = parseFloat(order.shipping_paid) || 0;
                const country3 = iso2to3[order.shipping_address_iso] || order.shipping_address_iso;
                const baseValue = totalPaid - shippingCost;
                const parcelValue = country3 === 'GBR' ? baseValue / 1.20 : baseValue;

                return (
                  <Fragment key={order.id}>
                    <tr className={styles.summaryRow}>
                      <td className={styles.expandCell} onClick={() => toggle(order.id)}>
                        {expanded.has(order.id) ? '▼' : '►'}
                      </td>
                      <td>
                        <div className={styles.orderCell}>
                          <img
                            src={getChannelLogo(order.channel_id)}
                            alt={getChannelName(order.channel_id)}
                            className={styles.logoSmall}
                          />
                          <strong>{order.channel_order_id}</strong>
                        </div>
                      </td>
                      <td>{order.shipping_name_company || order.shipping_name}</td>
                      <td>{order.inventory.length} item{order.inventory.length > 1 ? 's' : ''}</td>
                      <td className={styles.totalColumn}>£{formatPrice(order.total_paid)}</td>
                      <td className={styles.actionColumn}>
                        <a
                          href={order.access_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.selectButton}
                        >
                          ↗
                        </a>
                      </td>
                    </tr>
                    {expanded.has(order.id) && (
                      <tr className={styles.detailRow}>
                        <td />
                        <td>
                          <div className={styles.orderCell}>
                            <div><strong>Channel:</strong> {getChannelName(order.channel_id)}</div>
                            <div><strong>Alt ID:</strong> {order.channel_alt_id}</div>
                            <div><strong>Sale Type:</strong> {order.sale_type}</div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.orderCell}>
                            <div><strong>Phone:</strong> {order.phone_one}</div>
                            <div><strong>Email:</strong> {truncateEmail(order.email)}</div>
                            <div><strong>Address:</strong> {order.shipping_address_line_one}</div>
                            {order.shipping_address_line_two && (
                              <div>{order.shipping_address_line_two}</div>
                            )}
                            <div>{order.shipping_address_city}, {order.shipping_address_postcode}, {country3}</div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.orderCell}>
                            {order.inventory.map((item, idx) => (
                              <div key={idx} className={styles.itemRow}>
                                <div><strong>SKU:</strong> {item.sku}</div>
                                <div>({item.quantity}) {item.name}</div>
                                {item.options && (<div><strong>Options:</strong> {item.options}</div>)}
                                <div><strong>Price:</strong> £{formatPrice(item.price)}</div>
                              ))}  
                          </div>
                        </td>
                        <td className={styles.totalColumn}>
                          <div className={styles.orderCell}>
                            {parseFloat(order.total_tax) > 0 && (<div><strong>Total Tax:</strong> £{formatPrice(order.total_tax)}</div>)}
                            {shippingCost > 0 && (<div><strong>Shipping:</strong> £{formatPrice(order.shipping_paid)}</div>)}
                            {parseFloat(order.total_discount) > 0 && (<div><strong>Total Discount:</strong> £{formatPrice(order.total_discount)}</div>)}
                            {totalPaid > 0 && (<div><strong>Total Paid:</strong> £{formatPrice(order.total_paid)}</div>)}
                            <div><strong>Parcel Value:</strong> £{parcelValue.toFixed(2)}</div>
                            <div className={styles.orderCell}>
                              <div><strong>Package Info</strong></div>
                              <label>Weight (kg): <input type="number" step="0.01" /></label>
                              <label>Length (cm): <input type="number" step="0.1" /></label>
                              <label>Width (cm): <input type="number" step="0.1" /></label>
                              <label>Height (cm): <input type="number" step="0.1" /></label>
                            </div>
                          </div>
                        </td>
                        <td className={styles.actionColumn}>
                          <button
                            className={styles.primaryButton}
                            onClick={() => {
                              const params = new URLSearchParams({
                                deliveryProperty: order.shipping_address_line_two
                                  ? `${order.shipping_address_line_one} ${order.shipping_address_line_two}`
                                  : order.shipping_address_line_one,
                                deliveryTown: order.shipping_address_city,
                                deliveryPostcode: order.shipping_address_postcode,
                                deliveryCountry: country3,
                                deliveryParcelValue: parcelValue.toFixed(2),
                              }).toString();
                              router.push(`/?${params}`);
                            }}
                          >
                            Get Quote
                          </button>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
