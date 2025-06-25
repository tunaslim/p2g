'use client';
import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import axios from 'axios';
import { useToken } from '../context/TokenContext';

// Types for Parcel2Go extras and quotes
interface Service {
  CourierName: string;
  Name: string;
  Slug: string;
  MaxHeight: number;
  MaxWidth: number;
  MaxLength: number;
  MaxWeight: number;
  Links: { ImageSvg: string };
}
interface AvailableExtra {
  Type: string;
  Price: number;
  Vat: number;
  Total: number;
  Details: {
    IncludedCover: string;
    MaxWeight: string;
  } | null;
}
interface Quote {
  AvailableExtras: AvailableExtra[];
  Service: Service;
  TotalPrice: number;
  TotalPriceExVat: number;
  EstimatedDeliveryDate: string;
  IncludedCover: number;
}
interface Order {
  inventory: { sku: string; quantity: number; name: string }[];
  shipping_name_company: string | null;
  shipping_name: string;
  phone_one: string;
  email: string;
  shipping_address_line_two: string | null;
  id: number;
  channel_id: number;
  channel_order_id: string;
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
  total_paid: string;
  date_received: string;
}

export default function DespatchReadyOrders() {
  const { token } = useToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const [packageInfo, setPackageInfo] = useState<Record<number, { weight: string; length: string; width: string; height: string }>>({});
  const [quotesMap, setQuotesMap] = useState<Record<number, Quote[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

  const iso2to3: Record<string, string> = { GB: 'GBR', US: 'USA', DE: 'DEU', FR: 'FRA', IT: 'ITA', TR: 'TUR' };
  const apiBase = 'https://p2g-api.up.railway.app';

  const fetchQuotesForOrder = async (order: Order) => {
    setLoadingMap(prev => ({ ...prev, [order.id]: true }));
    const info = packageInfo[order.id] || { weight: '', length: '', width: '', height: '' };
    const country3 = iso2to3[order.shipping_address_iso] || order.shipping_address_iso;
    const payload = {
      CollectionAddress: { Country: 'GBR', Property: 'Unit 45B Basepoint', Postcode: 'BN9 9BA', Town: 'Newhaven' },
      DeliveryAddress: { Country: country3, Property: order.shipping_address_line_one, Postcode: order.shipping_address_postcode, Town: order.shipping_address_city },
      Parcels: [{ Value: parseFloat(order.total_paid) || 0, Weight: parseFloat(info.weight) || 0, Length: parseFloat(info.length) || 0, Width: parseFloat(info.width) || 0, Height: parseFloat(info.height) || 0 }]
    };
    try {
      const resp = await axios.post<{ Quotes: Quote[] }>(`${apiBase}/get-quote`, { order: payload });
      setQuotesMap(prev => ({
        ...prev,
        [order.id]: resp.data.Quotes.sort((a, b) => a.TotalPrice - b.TotalPrice).slice(0, 10)
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMap(prev => ({ ...prev, [order.id]: false }));
    }
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const resp = await axios.get<{ total: number; data: Order[] }>('/api/helm-orders?status=3', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(resp.data.data || []);
        setTotal(resp.data.total || 0);
      } catch {
        setError('Failed to fetch orders');
      }
    })();
  }, [token]);

  return (
    <div className={styles.main}>
      <h1 className={styles.title}>Despatch Ready Orders ({total})</h1>
      {error && <p className={styles.error}>{error}</p>}
      {!error && !orders.length && <p className={styles.subTitle}>No despatch-ready orders found.</p>}
      {orders.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th />
                <th className={styles.orderColumn}>Order</th>
                <th className={styles.customerColumn}>Customer</th>
                <th className={styles.itemsColumn}>Items</th>
                <th className={styles.totalColumn}>Total</th>
                <th className={styles.actionColumn}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const totalPaid = parseFloat(order.total_paid) || 0;
                return (
                  <Fragment key={order.id}>
                    <tr
                      className={styles.quotesRow}
                      onClick={() => setExpanded(prev => {
                        const n = new Set(prev);
                        n.has(order.id) ? n.delete(order.id) : n.add(order.id);
                        return n;
                      })}
                    >
                      <td className={styles.expandCell}>{expanded.has(order.id) ? '▼' : '►'}</td>
                      <td><strong>{order.channel_order_id}</strong></td>
                      <td className={styles.customerColumn}>{order.shipping_name_company || order.shipping_name}</td>
                      <td className={styles.itemsColumn}>{order.inventory.length}</td>
                      <td className={styles.totalColumn}>£{totalPaid.toFixed(2)}</td>
                      <td className={styles.actionColumn}><button className={styles.selectButton}>↗</button></td>
                    </tr>

                    {expanded.has(order.id) && (
                      <>  {/* Expanded Quote Rows */}
                        {quotesMap[order.id]?.map((quote, idx) => {
                          // locate extended cover extra
                          const extCover = quote.AvailableExtras.find(e => e.Type === 'ExtendedBaseCover');
                          let extraRow = null;
                          if (extCover && extCover.Details) {
                            const currentProtection = quote.IncludedCover;
                            const extendedProtection = parseFloat(extCover.Details.IncludedCover);
                            const totalWithExtended = quote.TotalPrice + extCover.Total;
                            extraRow = (
                              <tr key={`extra-${idx}`} className={styles.extraRow}>
                                <td />
                                <td colSpan={5}>
                                  <strong>
                                    INFO: Current Protection: £{currentProtection.toFixed(0)} | Book with £{extendedProtection.toFixed(0)} Protection Total: £{totalWithExtended.toFixed(2)}
                                  </strong>
                                </td>
                                <td />
                              </tr>
                            );
                          } else if (quote.IncludedCover > 0) {
                            extraRow = (
                              <tr key={`included-${idx}`} className={styles.extraRow}>
                                <td />
                                <td colSpan={5}>
                                  <strong>
                                    INFO: Current Protection: £{quote.IncludedCover.toFixed(0)} | Extended protection not available.
                                  </strong>
                                </td>
                                <td />
                              </tr>
                            );
                          }

                          return (
                            <Fragment key={idx}>
                              <tr className={styles.quotesRow}>
                                <td />
                                <td>{quote.Service.CourierName}</td>
                                <td><strong>{quote.Service.Name}</strong><br/>({quote.Service.Slug})</td>
                                <td>£{quote.TotalPrice.toFixed(2)}</td>
                                <td>{new Date(quote.EstimatedDeliveryDate).toLocaleDateString()}</td>
                                <td />
                              </tr>
                              {extraRow}
                            </Fragment>
                          );
                        })}
                      </>
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
