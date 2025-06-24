'use client';
import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';
import axios from 'axios';
import { useToken } from '../context/TokenContext';

// Types for Parcel2Go quotes
interface Service {
  CourierName: string;
  Name: string;
  Slug: string;
  MaxHeight: number;
  MaxWidth: number;
  MaxLength: number;
  MaxWeight: number;
  Links: {
    ImageSvg: string;
  };
}
interface Quote {
  Service: Service;
  TotalPriceExVat: number;
  TotalPrice: number;
  EstimatedDeliveryDate: string;
}

interface Order {
  inventory: { sku: string; quantity: number; name: string; options: string; price: string; unit_tax: string }[];
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
  date_received: string;
}

export default function DespatchReadyOrders() {
  const router = useRouter();
  const { token } = useToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Package input state per order
  const [packageInfo, setPackageInfo] = useState<Record<number, { weight: string; length: string; width: string; height: string }>>({});

  // Quotes and loading state per order
  const [quotesMap, setQuotesMap] = useState<Record<number, Quote[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

  const iso2to3: Record<string, string> = {
    GB: 'GBR', US: 'USA', DE: 'DEU', FR: 'FRA', IT: 'ITA', TR: 'TUR',
    ES: 'ESP', CA: 'CAN', NL: 'NLD', IL: 'ISR', BE: 'BEL', JP: 'JPN',
    CH: 'CHE', CL: 'CHL',
  };

  const getChannelLogo = (id: number) => {
    switch (id) {
      case 24: case 15: return '/logos/ebay.png';
      case 27: case 25: case 6: case 2: case 5: case 4: case 3: return '/logos/amazon.png';
      case 11: return '/logos/etsy.png';
      case 8: case 7: return '/logos/shopify.png';
      case 26: return '/logos/woocommerce.png';
      default: return '/logos/default.png';
    }
  };

  const truncateEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    return local.length > 15 ? `${local.slice(0,5)}[...]${local.slice(-5)}@${domain}` : email;
  };

  const apiBase = 'https://p2g-api.up.railway.app';

  const fetchQuotesForOrder = async (order: Order) => {
    const country3 = iso2to3[order.shipping_address_iso] || order.shipping_address_iso;
    const info = packageInfo[order.id] || { weight: '', length: '', width: '', height: '' };
    setLoadingMap(prev => ({ ...prev, [order.id]: true }));
    try {
      const payload = {
        CollectionAddress: { Country: 'GBR', Property: 'Unit 45B Basepoint, Denton Island', Postcode: 'BN9 9BA', Town: 'Newhaven' },
        DeliveryAddress: {
          Country: country3,
          Property: order.shipping_address_line_two
            ? `${order.shipping_address_line_one} ${order.shipping_address_line_two}`
            : order.shipping_address_line_one,
          Postcode: order.shipping_address_postcode,
          Town: order.shipping_address_city,
        },
        Parcels: [{
          Value: parseFloat(order.total_paid) || 0,
          Weight: parseFloat(info.weight) || 0,
          Length: parseFloat(info.length) || 0,
          Width: parseFloat(info.width) || 0,
          Height: parseFloat(info.height) || 0,
        }]
      };
      const resp = await axios.post<{ Quotes: Quote[] }>(`${apiBase}/get-quote`, { order: payload });
      setQuotesMap(prev => ({
        ...prev,
        [order.id]: resp.data.Quotes.sort((a,b)=>a.TotalPrice-b.TotalPrice).slice(0,5)
      }));
    } catch (e) { console.error(e); } finally {
      setLoadingMap(prev => ({ ...prev, [order.id]: false }));
    }
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const resp = await axios.get<{ total: number; data: Order[] }>('/api/helm-orders', {
          headers: { Authorization: `Bearer ${token}`, 'X-Helm-Filter': 'status[]=3' }
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
                <th/>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th className={styles.totalColumn}>Total</th>
                <th className={styles.actionColumn}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const totalPaid = parseFloat(order.total_paid)||0;
                const shippingCost = parseFloat(order.shipping_paid)||0;
                const country3 = iso2to3[order.shipping_address_iso]||order.shipping_address_iso;
                const baseValue = totalPaid - shippingCost;
                const parcelValue = country3==='GBR'?baseValue/1.2:baseValue;
                const info = packageInfo[order.id]||{weight:'',length:'',width:'',height:''};

                return (
                  <Fragment key={order.id}>
                    <tr className={styles.summaryRow}>
                      <td className={styles.expandCell} onClick={()=>setExpanded(p=>{const n=new Set(p);n.has(order.id)?n.delete(order.id):n.add(order.id);return n;})}>
                        {expanded.has(order.id)?'▼':'►'}
                      </td>
                      <td><div className={styles.orderCell}><img src={getChannelLogo(order.channel_id)} className={styles.logo} alt=""/><strong>{order.channel_order_id}</strong></div></td>
                      <td>{order.shipping_name_company||order.shipping_name}</td>
                      <td>{order.inventory.length} item{order.inventory.length>1?'s':''}</td>
                      <td className={styles.totalColumn}>£{totalPaid.toFixed(2)}</td>
                      <td className={styles.actionColumn}><a href={order.access_url} target="_blank" rel="noopener noreferrer" className={styles.selectButton}>↗</a></td>
                    </tr>
                    {expanded.has(order.id)&&(
                      <>
                        <tr className={styles.detailRow}>
                          <td/>
                          <td><div className={styles.orderCell}><div>{order.date_received}</div><div><strong>Alt ID:</strong> {order.channel_alt_id}</div><div><strong>Sale:</strong> {order.sale_type}</div></div></td>
                          <td><div className={styles.orderCell}><div><strong>Phone:</strong> {order.phone_one}</div><div><strong>Email:</strong> {truncateEmail(order.email)}</div><div><strong>Address:</strong> {order.shipping_address_line_one}{order.shipping_address_line_two?` ${order.shipping_address_line_two}`:''}, {order.shipping_address_city}, {order.shipping_address_postcode}, {country3}</div></div></td>
                          <td><div className={styles.orderCell}>{order.inventory.map((i,idx)=><div key={idx}><strong>{i.name}</strong> (x{i.quantity})</div>)}</div></td>
                          <td className={styles.totalColumn}><div className={styles.orderCell}><div><strong>Total Tax:</strong> £{parseFloat(order.total_tax).toFixed(2)}</div><div><strong>Shipping:</strong> £{shippingCost.toFixed(2)}</div><div><strong>Parcel Value:</strong> £{parcelValue.toFixed(2)}</div></div></td>
                          <td className={styles.actionColumn}><div className={styles.orderCell}><div><strong>Package Info</strong></div><label>Weight (kg): <input type="number" value={info.weight} onChange={e=>setPackageInfo(p=>({...p,[order.id]:{...info,weight:e.target.value}}))}/></label><label>Length (cm): <input type="number" value={info.length} onChange={e=>setPackageInfo(p=>({...p,[order.id]:{...info,length:e.target.value}}))}/></label><label>Width (cm): <input type="number" value={info.width} onChange={e=>setPackageInfo(p=>({...p,[order.id]:{...info,width:e.target.value}}))}/></label><label>Height (cm): <input type="number" value={info.height} onChange={e=>setPackageInfo(p=>({...p,[order.id]:{...info,height:e.target.value}}))}/></label><button onClick={()=>fetchQuotesForOrder(order)} className={styles.primaryButton}>Get Quotes</button></div></td>
                        </tr>
                        {loadingMap[order.id]&&<tr className={styles.quotesRow}><td/><td colSpan={5}>Getting cheapest 5 quotes...</td></tr>}
                        {quotesMap[order.id]?.map((q,idx)=>(
                          <tr key={idx} className={styles.quotesRow}>
                            <td/>
                            <td className={styles.orderCell}>
                              <img
                                src={q.Service.Links.ImageSvg}
                                alt={`${q.Service.CourierName} logo`}
                                className={styles.logo}
                                />{' '}
                                {q.Service.CourierName}
                            </td>
                            <td><strong>{q.Service.Name}</strong><br/>({q.Service.Slug})</td>
                            <td><strong>Max: </strong>{q.Service.MaxWeight}kg<br/>{q.Service.MaxHeight*100}x{q.Service.MaxWidth*100}x{q.Service.MaxLength*100}cm</td>
                            <td>£{q.TotalPriceExVat.toFixed(2)}</td>
                            <td>£{q.TotalPrice.toFixed(2)}</td>
                            <td>{new Date(q.EstimatedDeliveryDate).toLocaleDateString()}</td>
                          </tr>
                        ))}
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
