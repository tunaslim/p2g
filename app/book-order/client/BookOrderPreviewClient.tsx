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

  const handlePrePay = async () => {
  if (!response?.Links?.PayWithPrePay) return;
  setLoading(true);
  setError(null);

  try {
    // Get the user token from context/local storage
    const token = localStorage.getItem('p2g_token') || ""; // Update to how you store the token

    const res = await fetch('/api/paywithprepay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: response.Links.PayWithPrePay, token })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);

    // Handle result: you may get a redirect url or confirmation
    alert('Payment successful!');
    // Or, if there's a new URL to visit:
    // window.open(data.redirectUrl, '_blank');
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

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
          <form
            action={response.Links.PayWithPrePay}
            method="post"
            target="_blank"
            style={{ display: 'inline' }}
          >
            <button onClick={handlePrePay} disabled={loading} className={styles.button}>
              Pay Shipment with PrePay
            </button>
          </form>
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
