"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../page.module.css';

export default function BookOrderPreviewClient() {
  const params = useSearchParams();
  const raw = params.get('order') || '';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setOrder(JSON.parse(decodeURIComponent(raw)));
    } catch {
      setError('Invalid order payload');
    }
  }, [raw]);

  const handleCreate = async () => {
    if (!order) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://p2g-api.up.railway.app/paywithprepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payWithPrePayUrl: response.Links.PayWithPrePay }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
  
      // If Parcel2Go responds with a URL, open it in a new tab
      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      } else {
        alert("Payment successful!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!order) return <p>Loading payload…</p>;

  return (
    <div className={styles.preview}>
      <h1>Preview Order</h1>
      <section>
        <h2>Full JSON Payload</h2>
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
          {JSON.stringify(order, null, 2)}
        </pre>
      </section>
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <button onClick={handleCreate} disabled={loading} className={styles.button}>
          {loading ? 'Creating…' : 'Create Order on P2G'}
        </button>
          {response?.Links?.PayWithPrePay && (
            <button
              onClick={handlePrePay}
              className={styles.button}
              disabled={loading}
            >
              {loading ? "Paying…" : "Pay Shipment with PrePay"}
            </button>
          )}
      </div>
      {response && (
        <section>
          <h2>Response</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
