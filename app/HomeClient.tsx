'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

// Type Definitions for Parcel2Go
interface ServiceLinks {
  ImageSmall: string;
}

interface Service {
  CourierName: string;
  Name: string;
  Slug: string;
  ShortDescriptions?: string;
  MaxHeight: number;
  MaxWidth: number;
  MaxLength: number;
  MaxWeight: number;
  Links: ServiceLinks;
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

interface QuotesResponse {
  Quotes: Quote[];
}

interface LabelResponse {
  ShipmentLabels: { LabelUrl: string }[];
}

// Parcel2Go Order Types
interface ParcelInput {
  Value: string;
  Weight: string;
  Length: string;
  Width: string;
  Height: string;
}

interface Order {
  CollectionAddress: {
    Country: string;
    Property: string;
    Postcode: string;
    Town: string;
  };
  DeliveryAddress: {
    Country: string;
    Property: string;
    Postcode: string;
    Town: string;
  };
  Parcels: ParcelInput[];
}

export default function HomeClient() {
  const searchParams = useSearchParams();

  const [order, setOrder] = useState<Order>({
    CollectionAddress: {
      Country: 'GBR',
      Property: 'Unit 45B Basepoint, Denton Island',
      Postcode: 'BN9 9BA',
      Town: 'Newhaven',
    },
    DeliveryAddress: {
      Country: '',
      Property: '',
      Postcode: '',
      Town: '',
    },
    Parcels: [{ Value: '', Weight: '', Length: '', Width: '', Height: '' }],
  });

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState<Quote | null>(null);
  const [label, setLabel] = useState<LabelResponse | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});

  const apiBase = 'https://p2g-api.up.railway.app';

  // Prefill from search params
  useEffect(() => {
    const prop = searchParams.get('deliveryProperty');
    const parcelVal = searchParams.get('deliveryParcelValue');
    setOrder(prev => {
      const updated = { ...prev };
      if (prop) {
        updated.DeliveryAddress = {
          Country: searchParams.get('deliveryCountry') || prev.DeliveryAddress.Country,
          Property: prop,
          Postcode: searchParams.get('deliveryPostcode') || prev.DeliveryAddress.Postcode,
          Town: searchParams.get('deliveryTown') || prev.DeliveryAddress.Town,
        };
      }
      if (parcelVal) {
        updated.Parcels = [{ ...prev.Parcels[0], Value: parcelVal }];
      }
      return updated;
    });
  }, [searchParams]);

  // Fetch quotes
  const getQuotes = async () => {
    setLoading(true);
    setError('');
    try {
      const parsedOrder = {
        ...order,
        Parcels: order.Parcels.map(p => ({
          Value: parseFloat(p.Value) || 0,
          Weight: parseFloat(p.Weight) || 0,
          Length: parseFloat(p.Length) || 0,
          Width: parseFloat(p.Width) || 0,
          Height: parseFloat(p.Height) || 0,
        })),
      };

      const response = await axios.post<QuotesResponse>(
        `${apiBase}/get-quote`,
        { order: parsedOrder }
      );
      setQuotes(response.data.Quotes);
    } catch (err: any) {
      console.error(err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err.message || 'Failed to get quotes.'
      );
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Create label
  const createLabel = async () => {
    if (!selectedService) {
      setError('No service selected');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post<LabelResponse>(
        `${apiBase}/create-label`,
        { labelData: { ...order, SelectedService: selectedService } }
      );
      setLabel(response.data);
    } catch (err: any) {
      console.error(err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : err.message || 'Failed to create label.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Parcel2Go Integration</h1>

      {loading && <p className={styles.loading}>Loading...</p>}
      {error && <p className={styles.error}>Error: {error}</p>}

      {!quotes.length && !label && (
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Manual Quote</h2>

          <h3 className={styles.subTitle}>Sender Address</h3>
          {(['Country', 'Property', 'Postcode', 'Town'] as const).map(field => (
            <input
              key={field}
              className={styles.input}
              placeholder={
                field === 'Country' ? 'Country (e.g., GBR)' : `Collection ${field}`
              }
              value={order.CollectionAddress[field]}
              onChange={e =>
                setOrder({
                  ...order,
                  CollectionAddress: {
                    ...order.CollectionAddress,
                    [field]: e.target.value,
                  },
                })
              }
            />
          ))}

          <h3 className={styles.subTitle}>Delivery Address</h3>
          {(['Country', 'Property', 'Postcode', 'Town'] as const).map(field => (
            <input
              key={field}
              className={styles.input}
              placeholder={
                field === 'Country' ? 'Country (e.g., GBR)' : `Delivery ${field}`
              }
              value={order.DeliveryAddress[field]}
              onChange={e =>
                setOrder({
                  ...order,
                  DeliveryAddress: {
                    ...order.DeliveryAddress,
                    [field]: e.target.value,
                  },
                })
              }
            />
          ))}

          <h3 className={styles.subTitle}>Parcel Details</h3>
          {(['Value', 'Weight', 'Length', 'Width', 'Height'] as const).map(field => (
            <input
              key={field}
              className={styles.input}
              placeholder={
                `Parcel ${field}` +
                (field === 'Weight'
                  ? ' (kg)'
                  : ['Length', 'Width', 'Height'].includes(field)
                  ? ' (cm)'
                  : '')
              }
              type="number"
              value={order.Parcels[0][field as keyof ParcelInput]}
              onChange={e =>
                setOrder({
                  ...order,
                  Parcels: [{ ...order.Parcels[0], [field]: e.target.value }],
                })
              }
            />
          ))}

          <button onClick={getQuotes} className={styles.primaryButton}>
            Get Quotes
          </button>
        </div>
      )}

      {quotes.length > 0 && !label && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Courier</th>
                <th>Service</th>
                <th>Price (excl. VAT)</th>
                <th>Total Price</th>
                <th>Est. Delivery</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quotes
                .slice()
                .sort((a, b) => a.TotalPrice - b.TotalPrice)
                .map((quote, idx) => {
                  const svc = quote.Service;
                  const isExpanded = !!expandedDescriptions[idx];

                  return (
                    <>
                      <tr key={`svc-${idx}`}>
                        <td>
                          <img
                            src={svc.Links.ImageSmall}
                            alt={svc.Name}
                            className={styles.logo}
                          />
                        </td>
                        <td>
                          <span className={styles.bold}>{svc.CourierName}</span><br/>
                          <span className={styles.maxdims}>{svc.Slug}</span>
                        </td>
                        <td>
                          <span className={styles.bold}>{svc.Name}</span>
                          {svc.ShortDescriptions && (
                            <>
                              <button
                                className={styles.toggleButton}
                                onClick={() =>
                                  setExpandedDescriptions(prev => ({
                                    ...prev,
                                    [idx]: !prev[idx],
                                  }))
                                }
                              >
                                {isExpanded ? 'Hide Details' : 'Show Details'}
                              </button>
                              {isExpanded && (
                                <div
                                  className={styles.description}
                                  dangerouslySetInnerHTML={{ __html: svc.ShortDescriptions! }}
                                />
                              )}
                            </>
                          )}
                          <br />
                          <span className={styles.maxdims}>
                            Max: {svc.MaxWeight}kg MaxDims:{' '}
                            {svc.MaxHeight * 100} x {svc.MaxWidth * 100} x{' '}
                            {svc.MaxLength * 100} cm
                          </span>
                        </td>
                        <td>£{quote.TotalPriceExVat.toFixed(2)}</td>
                        <td>£{quote.TotalPrice.toFixed(2)}</td>
                        <td>{new Date(quote.EstimatedDeliveryDate).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedService(quote);
                              createLabel();
                            }}
                            className={styles.selectButton}
                          >
                            Select
                          </button>
                        </td>
                      </tr>

                      {(() => {
                        const extCover = quote.AvailableExtras.find(
                          e => e.Type === 'ExtendedBaseCover'
                        );

                        if (extCover && extCover.Details) {
                          const currentProtection = quote.IncludedCover;
                          const extendedProtection = parseFloat(
                            extCover.Details.IncludedCover
                          );
                          const totalWithExtended = quote.TotalPrice + extCover.Total;

                          return (
                            <tr key={`extra-${idx}`} className={styles.extraRow}>
                              <td />
                              <td colSpan={5}>
                                <strong>
                                  INFO: Current Protection: £{currentProtection.toFixed(0)} | Book
                                  with £{extendedProtection.toFixed(0)} Protection Total: £
                                  {totalWithExtended.toFixed(2)}
                                </strong>
                              </td>
                              <td />
                            </tr>
                          );
                        } else if (quote.IncludedCover > 0) {
                          return (
                            <tr key={`included-${idx}`} className={styles.extraRow}>
                              <td />
                              <td colSpan={5}>
                                <strong>
                                  INFO: Current Protection: £
                                  {quote.IncludedCover.toFixed(0)} | Extended protection not available.
                                </strong>
                              </td>
                              <td />
                            </tr>
                          );
                        }

                        return null;
                      })()}
                    </>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {label && (
        <div className={styles.labelSection}>
          <h2 className={styles.sectionTitle}>Label Created!</h2>
          <a
            href={label.ShipmentLabels[0].LabelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.downloadButton}
          >
            Download Label
          </a>
        </div>
      )}
    </main>
  );
}
