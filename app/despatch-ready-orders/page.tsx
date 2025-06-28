// Despatch Ready Orders - Full Working File
"use client";
import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import axios from "axios";
import { useToken } from "../context/TokenContext";

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
  Details: { IncludedCover: string; MaxWeight: string } | null;
}

interface Quote {
  Service: Service;
  TotalPriceExVat: number;
  TotalPrice: number;
  EstimatedDeliveryDate: string;
  AvailableExtras: AvailableExtra[];
  IncludedCover: number;
}

interface Order {
  inventory: {
    sku: string;
    quantity: number;
    name: string;
    options: string;
    price: string;
    unit_tax: string;
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
  date_received: string;
}

export default function DespatchReadyOrders() {
  const router = useRouter();
  const { token } = useToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const [packageInfo, setPackageInfo] = useState<Record<number, { weight: string; length: string; width: string; height: string }>>({});
  const [quotesMap, setQuotesMap] = useState<Record<number, Quote[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

  const iso2to3: Record<string, string> = {
    GB: "GBR", US: "USA", DE: "DEU", FR: "FRA", IT: "ITA",
    TR: "TUR", ES: "ESP", CA: "CAN", NL: "NLD", IL: "ISR",
    BE: "BEL", JP: "JPN", CH: "CHE", CL: "CHL", AT: "AUT",
  };

  const getChannelLogo = (id: number) => {
    switch (id) {
      case 24: case 15: return "/logos/ebay.png";
      case 27: case 25: case 6: case 2: case 5: case 4: case 3: return "/logos/amazon.png";
      case 11: return "/logos/etsy.png";
      case 8: case 7: return "/logos/shopify.png";
      case 26: return "/logos/woocommerce.png";
      default: return "/logos/default.png";
    }
  };

  const truncateEmail = (email: string) => {
    const [local, domain] = email.split("@");
    return local.length > 15 ? `${local.slice(0, 5)}[...]${local.slice(-5)}@${domain}` : email;
  };

  const apiBase = "https://p2g-api.up.railway.app";

  const fetchQuotesForOrder = async (order: Order) => {
    const totalPaid = parseFloat(order.total_paid) || 0;
    const shippingCost = parseFloat(order.shipping_paid) || 0;
    const baseValue = totalPaid - shippingCost;
    const country3 = iso2to3[order.shipping_address_iso] || order.shipping_address_iso;
    const parcelValue = country3 === "GBR" ? baseValue / 1.2 : baseValue;
    const info = packageInfo[order.id] || { weight: "", length: "", width: "", height: "" };
    setLoadingMap((prev) => ({ ...prev, [order.id]: true }));
    try {
      const payload = {
        CollectionAddress: {
          Country: "GBR",
          Property: "Unit 45B Basepoint, Denton Island",
          Postcode: "BN9 9BA",
          Town: "Newhaven",
        },
        DeliveryAddress: {
          Country: country3,
          Property: order.shipping_address_line_two
            ? `${order.shipping_address_line_one} ${order.shipping_address_line_two}`
            : order.shipping_address_line_one,
          Postcode: order.shipping_address_postcode,
          Town: order.shipping_address_city,
        },
        Parcels: [
          {
            Value: parcelValue,
            Weight: parseFloat(info.weight) || 0,
            Length: parseFloat(info.length) || 0,
            Width: parseFloat(info.width) || 0,
            Height: parseFloat(info.height) || 0,
          },
        ],
      };
      const resp = await axios.post<{ Quotes: Quote[] }>(`${apiBase}/get-quote`, { order: payload });
      setQuotesMap((prev) => ({
        ...prev,
        [order.id]: resp.data.Quotes.sort((a, b) => a.TotalPrice - b.TotalPrice).slice(0, 10),
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const resp = await axios.get<{ total: number; data: Order[] }>("/api/helm-orders", {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Helm-Filter": "status[]=3",
          },
        });
        setOrders(resp.data.data || []);
        setTotal(resp.data.total || 0);
      } catch {
        setError("Failed to fetch orders");
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
              {orders.map((order) => {
                const totalPaid = parseFloat(order.total_paid) || 0;
                const shippingCost = parseFloat(order.shipping_paid) || 0;
                const country3 = iso2to3[order.shipping_address_iso] || order.shipping_address_iso;
                const baseValue = totalPaid - shippingCost;
                const parcelValue = country3 === "GBR" ? baseValue / 1.2 : baseValue;
                const info = packageInfo[order.id] || { weight: "", length: "", width: "", height: "" };

                return (
                  <Fragment key={order.id}>
                    {/* Order Row */}
                    <tr className={styles.quotesRow}>
                      <td className={styles.expandCell} onClick={() => setExpanded((prev) => {
                        const next = new Set(prev);
                        next.has(order.id) ? next.delete(order.id) : next.add(order.id);
                        return next;
                      })}>{expanded.has(order.id) ? "▼" : "►"}</td>
                      <td><strong>{order.channel_order_id}</strong></td>
                      <td>{order.shipping_name_company || order.shipping_name}</td>
                      <td>{order.inventory.length} item(s)</td>
                      <td>£{totalPaid.toFixed(2)}</td>
                      <td><a href={order.access_url} target="_blank" rel="noopener noreferrer" className={styles.selectButton}>↗</a></td>
                    </tr>

                    {expanded.has(order.id) && (
                      <>
                        <tr>
                          <td />
                          <td colSpan={5}>
                            <div className={styles.inlineFields}>
                              {['weight', 'length', 'width', 'height'].map((key) => (
                                <div key={key}>
                                  <label>{key.charAt(0).toUpperCase() + key.slice(1)} (cm):</label>
                                  <input
                                    type="number"
                                    value={info[key as keyof typeof info]}
                                    onChange={(e) =>
                                      setPackageInfo((prev) => ({
                                        ...prev,
                                        [order.id]: {
                                          ...info,
                                          [key]: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              ))}
                              <button onClick={() => fetchQuotesForOrder(order)} className={styles.primaryButton}>Get Quotes</button>
                            </div>
                          </td>
                        </tr>
                        {loadingMap[order.id] && (
                          <tr><td colSpan={6}>Getting quotes...</td></tr>
                        )}
                        {quotesMap[order.id]?.map((q, idx) => {
                          const currentProtection = q.IncludedCover;
                          const extCover = q.AvailableExtras.find((e) => e.Details?.IncludedCover && /\d/.test(e.Details.IncludedCover));
                          const extendedProtection = extCover ? parseFloat(extCover.Details!.IncludedCover.replace(/[^0-9.]/g, "")) : 0;
                          const totalWithExtended = q.TotalPrice + (extCover?.Total ?? 0);
                          const coverExtra = q.AvailableExtras.find((extra) => extra.Type === "Cover");
                          const coverTotal = coverExtra ? coverExtra.Total : 0;

                          return (
                            <tr key={`quote-${order.id}-${idx}`} className={styles.serviceQuoteRow}>
                              <td colSpan={6}>
                                <div className={styles.combinedRow}>
                                  <div className={styles.serviceColumn}>
                                    <img src={q.Service.Links.ImageSvg} alt={q.Service.CourierName} className={styles.logo} />
                                    <div className={styles.serviceDetails}>
                                      <strong>{q.Service.Name}</strong><br />({q.Service.Slug})
                                      <div><strong>Est. Delivery:</strong> {new Date(q.EstimatedDeliveryDate).toLocaleDateString()}</div>
                                      <div><strong>Max:</strong> {q.Service.MaxWeight}kg — {q.Service.MaxHeight * 100}×{q.Service.MaxWidth * 100}×{q.Service.MaxLength * 100}cm</div>
                                    </div>
                                  </div>
                                  <div className={styles.buttonGroup}>
                                    {currentProtection === 0 && (
                                      <>
                                        <div className={styles.buttonOption}>
                                          <div className={styles.price}>£{q.TotalPrice.toFixed(2)}</div>
                                          <button className={styles.outlineButton}>Book without Protection</button>
                                        </div>
                                        <div className={styles.buttonOption}>
                                          <div className={styles.price}>(+ £{(totalWithExtended - q.TotalPrice).toFixed(2)}) £{totalWithExtended.toFixed(2)}</div>
                                          <button className={styles.solidButton}>Book with £{extendedProtection.toFixed(0)} Protection</button>
                                        </div>
                                        <div className={styles.buttonOption}>
                                          <div className={styles.price}>(+ £{coverTotal.toFixed(2)}) £{(coverTotal + q.TotalPrice).toFixed(2)}</div>
                                          <button className={styles.solidButton}>Book with £{parcelValue.toFixed(2)} Protection</button>
                                        </div>
                                      </>
                                    )}
                                    {currentProtection > 0 && coverTotal === 0 && (
                                      <div className={styles.buttonOption}>
                                        <div className={styles.price}>£{q.TotalPrice.toFixed(2)}</div>
                                        <button className={styles.outlineButton}>Book with £{currentProtection.toFixed(0)} Protection</button>
                                      </div>
                                    )}
                                    {currentProtection > 0 && coverTotal > 0 && (
                                      <>
                                        <div className={styles.buttonOption}>
                                          <div className={styles.price}>£{q.TotalPrice.toFixed(2)}</div>
                                          <button className={styles.outlineButton}>Book with £{currentProtection.toFixed(0)} Protection</button>
                                        </div>
                                        <div className={styles.buttonOption}>
                                          <div className={styles.price}>(+ £{coverTotal.toFixed(2)}) £{(coverTotal + q.TotalPrice).toFixed(2)}</div>
                                          <button className={styles.solidButton}>Book with £{parcelValue.toFixed(2)} Protection</button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
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
