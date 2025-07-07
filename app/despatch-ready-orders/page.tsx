'use client';
import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import axios from "axios";
import { useToken } from "../context/TokenContext";

// --- Auto-fixer helper: Ensures parcel contents' sum matches parcel value ---
function fixParcelContentsValue<T extends { EstimatedValue: number }>(
  contents: T[],
  desiredParcelValue: number
): T[] {
  if (!contents.length) return [];
  const sumExceptLast = contents
    .slice(0, -1)
    .reduce((sum, item) => sum + Number(item.EstimatedValue), 0);
  let lastValue = Number((desiredParcelValue - sumExceptLast).toFixed(2));
  if (lastValue < 0) lastValue = 0.01;
  return [
    ...contents.slice(0, -1),
    { ...contents[contents.length - 1], EstimatedValue: lastValue },
  ];
}

interface Address {
  ContactName: string;
  Organisation: string;
  Email: string;
  Phone: string;
  Property: string;
  Street: string;
  Town: string;
  County: string;
  Postcode: string;
  CountryIsoCode: string;
  CountryId: number;
  SpecialInstructions?: string;
}

interface Content {
  Description: string;
  Quantity: number;
  EstimatedValue: number;
  TariffCode: string;
  CustomsDutyPaid: number;
  CustomsVatPaid: number;
  OriginCountry: string;
}

interface Parcel {
  Id: string;
  Height: number;
  Length: number;
  Width: number;
  Weight: number;
  EstimatedValue: number;
  DeliveryAddress: Address;
  Contents: Content[];
  ContentsSummary: string;
}

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
    inventory_id: string;
    sku: string;
    quantity: number;
    name: string;
    options: string;
    price: string;
    hs_code: string;
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
  CollectionAddress: Address;
  Parcels: Parcel[];
}

type SortType = 'noProtection' | 'extended' | 'full';

export default function DespatchReadyOrders() {
  const router = useRouter();
  const { token } = useToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const [packageInfo, setPackageInfo] = useState<
    Record<
      number,
      { weight: string; length: string; width: string; height: string }
    >
  >({});

  const [inventoryDetailsMap, setInventoryDetailsMap] = useState<Record<
  string,
  { hs_code: string; customs_description: string }
  >>({});

  const [quotesMap, setQuotesMap] = useState<Record<number, Quote[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [sortMap, setSortMap] = useState<Record<number, SortType>>({});

  const [selectedQuoteMap, setSelectedQuoteMap] = useState<Record<number, Quote | null>>({});

  const iso2to3: Record<string, string> = {
    GB: "GBR",
    US: "USA",
    DE: "DEU",
    FR: "FRA",
    IT: "ITA",
    TR: "TUR",
    ES: "ESP",
    CA: "CAN",
    NL: "NLD",
    IL: "ISR",
    BE: "BEL",
    JP: "JPN",
    CH: "CHE",
    CL: "CHL",
    AT: "AUT",
    TH: "THA",
    PL: "POL",
    MU: "MUS",
    KR: "KOR",
  };

  const getChannelLogo = (id: number) => {
    switch (id) {
      case 24:
      case 15:
        return "/logos/ebay.png";
      case 27:
      case 25:
      case 6:
      case 2:
      case 5:
      case 4:
      case 3:
        return "/logos/amazon.png";
      case 11:
        return "/logos/etsy.png";
      case 8:
      case 7:
        return "/logos/shopify.png";
      case 26:
        return "/logos/woocommerce.png";
      default:
        return "/logos/default.png";
    }
  };

  const truncateEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    return local.length > 15
      ? `${local.slice(0, 5)}[...]${local.slice(-5)}@${domain}`
      : email;
  };

  const apiBase = "https://p2g-api.up.railway.app";

  const fetchQuotesForOrder = async (order: Order) => {
    const totalPaid = parseFloat(order.total_paid.replace(/,/g, "")) || 0;
    const shippingCost = parseFloat(order.shipping_paid) || 0;
    const baseValue = totalPaid - shippingCost;
    const country3 =
      iso2to3[order.shipping_address_iso] || order.shipping_address_iso;
    const parcelValue = country3 === "GBR" ? baseValue / 1.2 : baseValue;

    const info = packageInfo[order.id] || {
      weight: "",
      length: "",
      width: "",
      height: "",
    };
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
      const resp = await axios.post<{ Quotes: Quote[] }>(
        `${apiBase}/get-quote`,
        { order: payload }
      );
      setQuotesMap((prev) => ({
        ...prev,
        [order.id]: resp.data.Quotes.sort(
          (a, b) => a.TotalPrice - b.TotalPrice
        ).slice(0, 10),
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
        const resp = await axios.get<{ total: number; data: Order[] }>(
          "/api/helm-orders",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Helm-Filter": "status[]=3",
            },
          }
        );
        setOrders(resp.data.data || []);
        setTotal(resp.data.total || 0);
      } catch {
        setError("Failed to fetch orders");
      }
    })();
  }, [token]);

  // Helper to get all unique inventory_ids from all orders
function getAllUniqueInventoryIds(orders: Order[]): string[] {
  const ids = new Set<string>();
  for (const order of orders) {
    for (const item of order.inventory) {
      if (item.inventory_id && item.inventory_id !== "") {
        ids.add(item.inventory_id); // or use item.inventory_id if present
      }
    }
  }
  return Array.from(ids);
}

// Fetch details for an array of inventory_ids and update the map
async function fetchAllInventoryDetails(ids: string[]) {
  if (!token) return; // Do nothing if not authenticated
  const newMap: Record<string, { hs_code: string; customs_description: string }> = {};
  await Promise.all(
    ids.map(async (id) => {
      if (!id) return;
      try {
        const resp = await fetch(`/api/inventory-details/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (resp.ok) {
          const data = await resp.json();
          newMap[id] = {
            hs_code: data.hs_code || "",
            customs_description: data.customs_description || "",
          };
        }
      } catch {
        // Ignore individual errors
      }
    })
  );
  setInventoryDetailsMap((prev) => ({ ...prev, ...newMap }));
}

// Fetch inventory details whenever orders change
useEffect(() => {
  if (orders.length === 0 || !token) return;
  const ids = getAllUniqueInventoryIds(orders);
  fetchAllInventoryDetails(ids);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [orders, token]);

  function sortQuotes(orderId: number, quotes: Quote[]): Quote[] {
    const mode = sortMap[orderId] || 'noProtection';
    return [...quotes].sort((a,b) => {
      if (mode==='noProtection') return a.TotalPrice - b.TotalPrice;
      if (mode==='extended') {
        const extA = a.AvailableExtras.find(e=>e.Type==='ExtendedBaseCover')?.Total||0;
        const extB = b.AvailableExtras.find(e=>e.Type==='ExtendedBaseCover')?.Total||0;
        return (a.TotalPrice+extA)-(b.TotalPrice+extB);
      }
      const covA = a.AvailableExtras.find(e=>e.Type==='Cover')?.Total||0;
      const covB = b.AvailableExtras.find(e=>e.Type==='Cover')?.Total||0;
      return (a.TotalPrice+covA)-(b.TotalPrice+covB);
    });
  }

const getNormalizedCourierName = (name: string) => {
  if (!name) return "";
  if (name.toLowerCase().startsWith("evri")) return "Evri";
  return name;
};

const handlePreview = (
  order: Order,
  quote: Quote,
  info: { weight: string; length: string; width: string; height: string },
  parcelValue: number,
  country3: string,
  protectionType: 'none' | 'extended' | 'cover'
) => {
  const payload = buildOrderPayload(order, quote, info, parcelValue, country3, protectionType);

  // Add courierName and serviceName to the payload
  const courierName = getNormalizedCourierName(quote.Service.CourierName);
  const serviceName = quote.Service.Name;
  const mergedPayload = { ...payload, courierName, serviceName };

  const encoded = encodeURIComponent(JSON.stringify(mergedPayload));
  window.open(`/book-order?order=${encoded}`, '_blank');
};

// Helper for guid
function generateGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

  // --- Main Order Payload Builder with Contents Auto-Fix ---
  const buildOrderPayload = (
    order: Order,
    quote: Quote,
    info: { weight: string; length: string; width: string; height: string },
    parcelValue: number,
    country3: string,
    protectionType: 'none' | 'extended' | 'cover'
  ) => {
    let IOSSCode = "";
    let EoriNumber = "";
    if ([2, 3, 4, 5, 6, 25, 27].includes(order.channel_id)) {
      IOSSCode = "IM4420001201";
    } else if (order.channel_id === 11) {
      IOSSCode = "IM3720000224";
    } else if ([15, 24].includes(order.channel_id)) {
      IOSSCode = "IM2760000742";
    } else if ([7, 8].includes(order.channel_id)) {
      EoriNumber = "GB122703551000";
    }
    const extCover = quote.AvailableExtras.find(e => e.Type === 'ExtendedBaseCover');
    const totalWithExtended = quote.TotalPrice + (extCover?.Total || 0);
    const coverExtra = quote.AvailableExtras.find(e => e.Type === 'Cover');
    const totalWithCover = quote.TotalPrice + (coverExtra?.Total || 0);

    // --- Auto-fix the content values ---
    const rawContents = order.inventory.map(item => {
      const details = inventoryDetailsMap[item.inventory_id] || {};
      return {
        Description: details.customs_description || item.name,
        Quantity: item.quantity,
        EstimatedValue: Number((parcelValue / order.inventory.length).toFixed(2)),
        TariffCode: details.hs_code || "00000000",
        OriginCountry: "United Kingdom",
      };
    });
    const fixedContents = fixParcelContentsValue(rawContents, parcelValue);

    let upsells = undefined;
    if (protectionType === 'extended' && extCover) {
      upsells = [{ Type: 'ExtendedBaseCover', Values: { Total: (totalWithExtended - quote.TotalPrice).toFixed(2) } }];
    } else if (protectionType === 'cover' && coverExtra) {
      upsells = [{ Type: 'Cover', Values: { Total: (totalWithCover - quote.TotalPrice).toFixed(2) } }];
    }

    return {
      Items: [
        {
          Id: generateGuid(),
          CollectionDate: new Date().toISOString(),
          OriginCountry: 'GBR',
          ExportReason: 'Sale',
          VatStatus: 'Individual',
          RecipientVatStatus: 'Individual',
          ...(IOSSCode && { IOSSCode }),
          ...(EoriNumber && { EoriNumber }),
          ...(upsells && { Upsells: upsells }),
          Service: quote.Service.Slug,
          Reference: order.channel_order_id,
          CollectionAddress: {
            ContactName: 'Jeremy Dredge',
            Organisation: 'Good Life Innovations Ltd',
            Email: 'sales@sfxc.co.uk',
            Phone: '02071183123',
            Property: 'Unit 45B Basepoint',
            Street: 'Denton Island',
            Town: 'Newhaven',
            County: 'East Sussex',
            Postcode: 'BN9 9BA',
            CountryIsoCode: 'GBR',
          },
          Parcels: [
            {
              Id: generateGuid(),
              Height: parseFloat(info.height) || 0,
              Length: parseFloat(info.length) || 0,
              Width: parseFloat(info.width) || 0,
              Weight: parseFloat(info.weight) || 0,
              EstimatedValue: Number(parcelValue.toFixed(2)),
              DeliveryAddress: {
                ContactName: order.shipping_name,
                Organisation: order.shipping_name_company,
                Email: order.email,
                Phone: order.phone_one,
                Property: order.shipping_address_line_one,
                Street: order.shipping_address_line_two || 'Street',
                Town: order.shipping_address_city,
                County: order.shipping_address_city,
                Postcode: order.shipping_address_postcode,
                CountryIsoCode: country3,
              },
              Contents: fixedContents,
              ContentsSummary:
                order.inventory
                  .map(item => `${item.quantity}x ${inventoryDetailsMap[item.inventory_id]?.customs_description || item.name}`)
                  .join(", ") || "Sale of goods",
            }
          ],
        }
      ],
      CustomerDetails: {
        Email: 'sales@sfxc.co.uk',
        Forename: 'Oliver',
        Surname: 'Dredge',
      }
    };
  };

  return (
    <div className={styles.main}>
      <h1 className={styles.title}>Despatch Ready Orders ({total})</h1>
      {error && <p className={styles.error}>{error}</p>}
      {!error && !orders.length && (
        <p className={styles.subTitle}>No despatch-ready orders found.</p>
      )}
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
                const totalPaid = parseFloat(order.total_paid.replace(/,/g, "")) || 0;
                const shippingCost = parseFloat(order.shipping_paid) || 0;
                const country3 =
                  iso2to3[order.shipping_address_iso] ||
                  order.shipping_address_iso;
                const baseValue = totalPaid - shippingCost;
                const parcelValue =
                  country3 === "GBR" ? baseValue / 1.2 : baseValue;
                const info = packageInfo[order.id] || {
                  weight: "",
                  length: "",
                  width: "",
                  height: "",
                };
                const sortedQuotes=sortQuotes(order.id,quotesMap[order.id]||[]);

                return (
                  <Fragment key={order.id}>
                    {/* Main order row */}
                    <tr className={styles.quotesRow}>
                      <td
                        className={styles.expandCell}
                        onClick={() =>
                          setExpanded((prev) => {
                            const next = new Set(prev);
                            next.has(order.id)
                              ? next.delete(order.id)
                              : next.add(order.id);
                            return next;
                          })
                        }
                      >
                        {expanded.has(order.id) ? "▼" : "►"}
                      </td>
                      <td>
                        <div className={styles.orderCell}>
                          <img
                            src={getChannelLogo(order.channel_id)}
                            className={styles.logo}
                            alt=""
                          />
                          <strong>{order.channel_order_id}</strong>
                        </div>
                      </td>
                      <td>
                        {order.shipping_name_company || order.shipping_name}
                      </td>
                      <td>
                        {order.inventory.length} item
                        {order.inventory.length > 1 ? "s" : ""}
                      </td>
                      <td className={styles.totalColumn}>
                        £{totalPaid.toFixed(2)}
                      </td>
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

                    {/* Expanded details */}
                    {expanded.has(order.id) && (
                      <>
                        <tr className={styles.summaryRow}>
                          <td />
                          <td>
                            <div className={styles.orderCell}>
                              <div>{order.date_received}</div>
                              <div>
                                <strong>Alt ID:</strong> {order.channel_alt_id}
                              </div>
                              <div>
                                <strong>Sale:</strong> {order.sale_type}
                              </div>
                              <div>{order.status_description}</div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.orderCell}>
                              <div>
                                <strong>Phone:</strong> {order.phone_one}
                              </div>
                              <div>
                                <strong>Email:</strong>{" "}
                                {truncateEmail(order.email)}
                              </div>
                              <div>
                                <strong>Address:</strong>{" "}
                                {order.shipping_address_line_one}
                                {order.shipping_address_line_two
                                  ? ` ${order.shipping_address_line_two}`
                                  : ""}
                                , {order.shipping_address_city},{" "}
                                {order.shipping_address_postcode}, {country3}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.orderCell}>
                              {order.inventory.map((item, i) => {
                                const details = inventoryDetailsMap[item.inventory_id] || {};
                                return (
                                  <div key={i}>
                                    <strong>{item.name || details.customs_description}</strong>
                                    {" (x" + item.quantity + ")"}
                                    {details.hs_code && (
                                      <span> | HS: {details.hs_code}</span>
                                    )}
                                    {" | Price: £" + Number(item.price).toFixed(2)}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className={styles.totalColumn}>
                            <div className={styles.orderCell}>
                              {parseFloat(order.total_discount) > 0 && (
                                <div>
                                  <strong>Total Discount:</strong> £
                                  {parseFloat(order.total_discount).toFixed(2)}
                                </div>
                              )}
                              {parseFloat(order.total_tax) > 0 && (
                                <div>
                                  <strong>Total Tax:</strong> £
                                  {parseFloat(order.total_tax).toFixed(2)}
                                </div>
                              )}
                              {shippingCost > 0 && (
                                <div>
                                  <strong>Shipping:</strong> £
                                  {shippingCost.toFixed(2)}
                                </div>
                              )}
                              <div>
                                <strong>Parcel Val.:</strong> £
                                {parcelValue.toFixed(2)}
                              </div>
                            </div>
                          </td>
                          <td></td>
                        </tr>
                        <tr className={styles.quotesRow}>
  <td />
  <td colSpan={5} className={styles.actionColumn}>
    <div className={styles.infoGroup}>
      {/* Weight */}
      <div className={styles.fieldBox}>
        <div className={styles.subInfo}>Weight (kg)</div>
        <input
          type="number"
          value={info.weight}
          onChange={(e) =>
            setPackageInfo(prev => ({
              ...prev,
              [order.id]: { ...info, weight: e.target.value }
            }))
          }
        />
      </div>
      {/* Length */}
      <div className={styles.fieldBox}>
        <div className={styles.subInfo}>Length (cm)</div>
        <input
          type="number"
          value={info.length}
          onChange={(e) =>
            setPackageInfo(prev => ({
              ...prev,
              [order.id]: { ...info, length: e.target.value }
            }))
          }
        />
      </div>
      {/* Width */}
      <div className={styles.fieldBox}>
        <div className={styles.subInfo}>Width (cm)</div>
        <input
          type="number"
          value={info.width}
          onChange={(e) =>
            setPackageInfo(prev => ({
              ...prev,
              [order.id]: { ...info, width: e.target.value }
            }))
          }
        />
      </div>
      {/* Height */}
      <div className={styles.fieldBox}>
        <div className={styles.subInfo}>Height (cm)</div>
        <input
          type="number"
          value={info.height}
          onChange={(e) =>
            setPackageInfo(prev => ({
              ...prev,
              [order.id]: { ...info, height: e.target.value }
            }))
          }
        />
      </div>
      {/* Get Quotes */}
      <div className={styles.buttonOption}>
        <button
          onClick={() => fetchQuotesForOrder(order)}
          className={styles.outlineButton}
        >
          Get Quotes
        </button>
      </div>
    </div>
  </td>
</tr>
                        <tr className={styles.serviceQuoteRow}>
                          <td colSpan={6} style={{ padding: '4px 16px', background: '#f0f0f0' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              {(['noProtection','extended','full'] as SortType[]).map(mode => (
                                <button
                                  key={mode}
                                  className={sortMap[order.id] === mode ? styles.solidButton : styles.outlineButton}
                                  onClick={() => setSortMap(prev => ({ ...prev, [order.id]: mode }))}
                                >
                                  {mode === 'noProtection'
                                    ? 'Sort by Without Protection Quotes'
                                    : mode === 'extended'
                                    ? 'Sort by With Extended Protection Quotes'
                                    : 'Sort by With Full Protection Quotes'}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                        {loadingMap[order.id] && (
                          <tr className={styles.quotesRow}>
                            <td />
                            <td colSpan={5}>Getting cheapest 10 quotes...</td>
                          </tr>
                        )}

                         {/* Combined Quote + Info row */}
                        {sortedQuotes.map((q, idx) => {
                          const currentProtection = q.IncludedCover;
                          const extCover = q.AvailableExtras.find(
                            (e) => e.Details?.IncludedCover && /\d/.test(e.Details.IncludedCover)
                          );
                          const extendedProtection = extCover
                            ? parseFloat(extCover.Details!.IncludedCover.replace(/[^0-9.]/g, ""))
                            : 0;
                          const totalWithExtended = q.TotalPrice + (extCover?.Total || 0);
                          const coverExtra = q.AvailableExtras.find((extra) => extra.Type === "Cover");
                          const coverTotal = coverExtra ? coverExtra.Total : 0;

                          return (
                            <tr key={`quote-${order.id}-${idx}`} className={styles.serviceQuoteRow}>
                              <td />
                              <td>
                                <img src={q.Service.Links.ImageSvg} alt={`${q.Service.CourierName} logo`} className={styles.logo} />
                                <br />
                                {q.Service.CourierName}
                              </td>
                              <td>
                                <div className={styles.serviceInfoBlock}>
                                  <div>
                                    <strong>{q.Service.Name}</strong>
                                    <br />
                                    ({q.Service.Slug})
                                  </div>
                                  <div className={styles.subInfo}>
                                    <div>
                                      <strong>Est. Delivery:</strong> {new Date(q.EstimatedDeliveryDate).toLocaleDateString()}
                                    </div>
                                    <div>
                                      <strong>Max:</strong> {q.Service.MaxWeight}kg — {q.Service.MaxHeight * 100}×{q.Service.MaxWidth * 100}×{q.Service.MaxLength * 100}cm
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td colSpan={3} style={{ textAlign: "right" }}>
                                <div className={styles.buttonGroup}>
                                  {currentProtection === 0 && (
                                    <>
                                      <div className={styles.buttonOption}>
                                        <div className={styles.price}>£{q.TotalPrice.toFixed(2)}</div>
                                        <button
                                          className={styles.outlineButton}
                                          onClick={() => {
                                            setSelectedQuoteMap(prev => ({
                                              ...prev,
                                              [order.id]: q
                                            }));
                                            handlePreview(order, q, info, parcelValue, country3, 'none');
                                          }}
                                        >
                                          Book without Protection
                                        </button>
                                      </div>
                                      <div className={styles.buttonOption}>
                                        <div className={styles.price}>(+ £{(totalWithExtended - q.TotalPrice).toFixed(2)}) £{totalWithExtended.toFixed(2)}</div>
                                        <button
                                          className={styles.outlineButton}
                                          onClick={() => {
                                            setSelectedQuoteMap(prev => ({
                                              ...prev,
                                              [order.id]: q
                                            }));
                                            handlePreview(order, q, info, parcelValue, country3, 'extended');
                                          }}
                                        >
                                          Book with £{extendedProtection.toFixed(0)} Protection
                                        </button>
                                      </div>
                                      <div className={styles.buttonOption}>
                                        <div className={styles.price}>(+ £{coverTotal}) £{(coverTotal + q.TotalPrice).toFixed(2)}</div>
                                        <button
                                          className={styles.solidButton}
                                          onClick={() => {
                                            setSelectedQuoteMap(prev => ({
                                              ...prev,
                                              [order.id]: q
                                            }));
                                            handlePreview(order, q, info, parcelValue, country3, 'cover'); // use a string flag for type
                                          }}
                                        >
                                          Book with £{parcelValue.toFixed(2)} Protection
                                        </button>
                                      </div>
                                    </>
                                  )}
                                  {currentProtection > 0 && coverTotal === 0 && (
                                    <div className={styles.buttonOption}>
                                      <div className={styles.price}>£{q.TotalPrice.toFixed(2)}</div>
                                      <button
                                          className={styles.outlineButton}
                                          onClick={() => {
                                            setSelectedQuoteMap(prev => ({
                                              ...prev,
                                              [order.id]: q
                                            }));
                                            handlePreview(order, q, info, parcelValue, country3, 'none');
                                          }}
                                        >
                                          Book with £{currentProtection.toFixed(0)} Protection
                                        </button>
                                    </div>
                                  )}
                                  {currentProtection > 0 && coverTotal > 0 && (
                                    <>
                                      <div className={styles.buttonOption}>
                                        <div className={styles.price}>£{q.TotalPrice.toFixed(2)}</div>
                                        <button
                                          className={styles.outlineButton}
                                          onClick={() => {
                                            setSelectedQuoteMap(prev => ({
                                              ...prev,
                                              [order.id]: q
                                            }));
                                            handlePreview(order, q, info, parcelValue, country3, 'none');
                                          }}
                                        >
                                          Book with £{currentProtection.toFixed(0)} Protection
                                        </button>
                                      </div>
                                      <div className={styles.buttonOption}>
                                        <div className={styles.price}>(+ £{coverTotal}) £{(coverTotal + q.TotalPrice).toFixed(2)}</div>
                                        <button
                                          className={styles.solidButton}
                                          onClick={() => {
                                            setSelectedQuoteMap(prev => ({
                                              ...prev,
                                              [order.id]: q
                                            }));
                                            handlePreview(order, q, info, parcelValue, country3, 'cover'); // use a string flag for type
                                          }}
                                        >
                                          Book with £{parcelValue.toFixed(2)} Protection
                                        </button>
                                      </div>
                                    </>
                                  )}
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
