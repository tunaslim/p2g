'use client';

import { useState } from 'react';
import axios from 'axios';
import styles from './page.module.css';

// Type Definitions for Parcel2Go
interface ServiceLinks {
  ImageSmall: string;
}

interface Service {
  CourierName: string;
  Name: string;
  ShortDescriptions?: string;
  MaxHeight: number;
  MaxWidth: number;
  MaxLength: number;
  MaxWeight: number;
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

export default function Home() {
  // Parcel2Go states
  const [order, setOrder] = useState<Order>({
    CollectionAddress: {
      Country: 'GBR',
      Property: 'Unit 45B Basepoint, Denton Island',
      Postcode: 'BN9 9BA',
      Town: 'Newhaven',
    },
    DeliveryAddress: { Country: '', Property: '', Postcode: '', Town: '' },
    Parcels: [{ Value: '', Weight: '', Length: '', Width: '', Height: '' }],
  });
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState<Quote | null>(null);
  const [label, setLabel] = useState<LabelResponse | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: number]: boolean }>({});

  const apiBase = 'https://p2g-api.up.railway.app';

  // Parcel2Go get quotes
  const getQuotes = async () => {
    try {
      setLoading(true);
      setError('');

      const parsedOrder = {
        ...order,
        Parcels: order.Parcels.map((parcel: ParcelInput) => ({
          Value: parseFloat(parcel.Value) || 0,
          Weight: parseFloat(parcel.Weight) || 0,
          Length: parseFloat(parcel.Length) || 0,
          Width: parseFloat(parcel.Width) || 0,
          Height: parseFloat(parcel.Height) || 0,
        })),
      };

      const response = await axios.post<QuotesResponse>(
        `${apiBase}/get-quote`,
        { order: parsedOrder }
      );
      setQuotes(response.data.Quotes);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quotes:', err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || err.message || 'Failed to get quotes.'
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to get quotes.');
      }

      setQuotes([]);
      setLoading(false);
    }
  };

  // Parcel2Go create label
  const createLabel = async () => {
    if (!selectedService) {
      setError('No service selected');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const labelData = {
        ...order,
        SelectedService: selectedService,
      };

      const response = await axios.post<LabelResponse>(
        `${apiBase}/create-label`,
        { labelData }
      );
      setLabel(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error creating label:', err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || err.message || 'Failed to create label.'
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create label.');
      }

      setLoading(false);
    }
  };

  // Render
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Parcel2Go Integration</h1>

      {loading && <p className={styles.loading}>Loading...</p>}

      {error && <p className={styles.error}>Error: {error}</p>}

      {(!quotes || quotes.length === 0) && (
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Manual Quote</h2>

          <h3 className={styles.subTitle}>Sender Address</h3>
          {(['Country', 'Property', 'Postcode', 'Town'] as const).map((field) => (
            <input
              key={field}
              className={styles.input}
              placeholder={
                field === 'Country'
                  ? 'Country (e.g., GBR)'
                  : `Collection ${field}`
              }
              value={order.CollectionAddress[field]}
              onChange={(e) =>
                setOrder({
                  ...order,
                  CollectionAddress: { ...order.CollectionAddress, [field]: e.target.value },
                })
              }
            />
          ))}

          <h3 className={styles.subTitle}>Delivery Address</h3>
          {(['Country', 'Property', 'Postcode', 'Town'] as const).map((field) => (
            <input
              key={field}
              className={styles.input}
              placeholder={
                field === 'Country'
                  ? 'Country (e.g., GBR)'
                  : `Delivery ${field}`
              }
              value={order.DeliveryAddress[field]}
              onChange={(e) =>
                setOrder({
                  ...order,
                  DeliveryAddress: { ...order.DeliveryAddress, [field]: e.target.value },
                })
              }
            />
          ))}

          <h3 className={styles.subTitle}>Parcel Details</h3>
          {['Value', 'Weight', 'Length', 'Width', 'Height'].map((field) => (
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
              onChange={(e) =>
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
                      <td>
                        <img
                          src={service.Links.ImageSmall}
                          alt={service.Name}
                          className={styles.logo}
                        />
                      </td>
                      <td>
                        <span className={styles.bold}>
                          {service.CourierName}
                        </span>
                      </td>
                      <td>
                        <span className={styles.bold}>{service.Name}</span>{' '}
                        {service.ShortDescriptions && (
                          <>
                            <button
                              className={styles.toggleButton}
                              onClick={() =>
                                setExpandedDescriptions({
                                  ...expandedDescriptions,
                                  [index]: !isExpanded,
                                })
                              }
                            >
                              {isExpanded ? 'Hide Details' : 'Show Details'}
                            </button>
                            {isExpanded && (
                              <div
                                className={styles.description}
                                dangerouslySetInnerHTML={{ __html: service.ShortDescriptions }}
                              />
                            )}
                          </>
                        )}
                        <br />
                        <span className={styles.maxdims}>
                          MaxWeight: {service.MaxWeight}kg{' '}
                          MaxHeight: {service.MaxHeight * 100}cm{' '}
                          MaxWidth: {service.MaxWidth * 100}cm{' '}
                          MaxLength: {service.MaxLength * 100}cm
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
