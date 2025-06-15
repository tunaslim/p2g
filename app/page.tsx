'use client';

import { useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';

// Type Definitions
interface ServiceLinks {
  ImageSmall: string;
}

interface Service {
  CourierName: string;
  Name: string;
  Description?: string;
  Links: ServiceLinks;
}

interface Quote {
  Service: Service;
  TotalPrice: number;
  TotalPriceExVat: number;
  EstimatedDeliveryDate: string;
}

interface QuotesResponse {
  Quotes: Quote[];
}

interface LabelResponse {
  ShipmentLabels: { LabelUrl: string }[];
}

export default function Home() {
  const [order, setOrder] = useState({
    CollectionAddress: { Country: '', Property: '', Postcode: '', Town: '', VatStatus: 'Individual' },
    DeliveryAddress: { Country: '', Property: '', Postcode: '', Town: '', VatStatus: 'Individual' },
    Parcels: [{ Value: '', Weight: '', Length: '', Width: '', Height: '' }],
    Extras: [],
    IncludedDropShopDistances: false,
    ServiceFilter: { IncludeServiceTags: [], ExcludeServiceTags: [] },
  });

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Quote | null>(null);
  const [label, setLabel] = useState<LabelResponse | null>(null);
  const [error, setError] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: number]: boolean }>({});

  const apiBase = 'https://p2g-api.up.railway.app';

  const getQuotes = async () => {
    try {
      setLoading(true);
      setError('');

      const parsedOrder = {
        ...order,
        Parcels: order.Parcels.map(parcel => ({
          Value: parseFloat(parcel.Value) || 0,
          Weight: parseFloat(parcel.Weight) || 0,
          Length: parseFloat(parcel.Length) || 0,
          Width: parseFloat(parcel.Width) || 0,
          Height: parseFloat(parcel.Height) || 0,
        })),
      };

      const response = await axios.post<QuotesResponse>(`${apiBase}/get-quote`, { order: parsedOrder });
      setQuotes(response.data.Quotes);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quotes:', err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Failed to get quotes.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to get quotes.');
      }

      setQuotes([]);
      setLoading(false);
    }
  };

  const createLabel = async () => {
    try {
      setLoading(true);
      setError('');

      const labelData = {
        ...order,
        SelectedService: selectedService,
      };

      const response = await axios.post<LabelResponse>(`${apiBase}/create-label`, { labelData });
      setLabel(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error creating label:', err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Failed to create label.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create label.');
      }

      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Parcel2Go Quote & Label Generator</h1>

      {loading && <p className={styles.loading}>Loading...</p>}

      {error && <p className={styles.error}>Error: {error}</p>}

      {(!quotes || quotes.length === 0) && (
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Order Details</h2>

          {/* Collection Address */}
          <h3 className={styles.subTitle}>Sender Address</h3>
          {(['Country', 'Property', 'Postcode', 'Town'] as const).map((field) => (
            <input
              key={field}
              className={styles.input}
              placeholder={field === 'Country' ? 'Country (e.g., GBR)' : `Collection ${field}`}
              value={order.CollectionAddress[field]}
              onChange={(e) => setOrder({
                ...order,
                CollectionAddress: { ...order.CollectionAddress, [field]: e.target.value },
              })}
            />
          ))}

          {/* Delivery Address */}
          <h3 className={styles.subTitle}>Delivery Address</h3>
          {(['Country', 'Property', 'Postcode', 'Town'] as const).map((field) => (
            <input
              key={field}
              className={styles.input}
              placeholder={field === 'Country' ? 'Country (e.g., GBR)' : `Delivery ${field}`}
              value={order.DeliveryAddress[field]}
              onChange={(e) => setOrder({
                ...order,
                DeliveryAddress: { ...order.DeliveryAddress, [field]: e.target.value },
              })}
            />
          ))}

          {/* Parcel Details */}
          <h3 className={styles.subTitle}>Parcel Details</h3>
          {['Value', 'Weight', 'Length', 'Width', 'Height'].map((field) => (
            <input
              key={field}
              className={styles.input}
              placeholder={`Parcel ${field}${field === 'Weight' ? ' (kg)' : field === 'Length' || field === 'Width' || field === 'Height' ? ' (cm)' : ''}`}
              type="number"
              value={order.Parcels[0][field as keyof typeof order.Parcels[0]]}
              onChange={(e) => setOrder({
                ...order,
                Parcels: [{ ...order.Parcels[0], [field]: e.target.value }],
              })}
            />
          ))}

          <button onClick={getQuotes} className={styles.primaryButton}>
            Get Quotes
          </button>
        </div>
      )}

      {quotes?.length > 0 && !label && (
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
                .map((quote, index) => {
                  const service = quote.Service;
                  const isExpanded = expandedDescriptions[index] || false;

                  return (
                    <tr key={index}>
                      <td><img src={service.Links.ImageSmall} alt={service.Name} className={styles.logo} /></td>
                      <td>{service.CourierName}</td>
                      <td>
                        {service.Name}
                        {service.ShortDescriptions && (
                          <>
                            <button
                              className={styles.descriptionToggle}
                              onClick={() =>
                                setExpandedDescriptions({
                                  ...expandedDescriptions,
                                  [index]: !isExpanded,
                                })
                              }
                            >
                              {isExpanded ? 'Hide Details' : 'Show Details'}
                            </button>
                            {isExpanded && <p className={styles.description}>{service.ShortDescriptions}</p>}
                          </>
                        )}
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
