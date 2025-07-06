"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "../page.module.css";

export default function BookOrderPreviewClient() {
  const params = useSearchParams();
  const raw = params.get("order") || "";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setOrder(JSON.parse(decodeURIComponent(raw)));
    } catch {
      setError("Invalid order payload");
    }
  }, [raw]);

  const handleCreate = async () => {
    if (!order) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

const handlePrePay = async () => {
  if (!response?.Links?.PayWithPrePay) {
    setError("No PayWithPrePay URL available.");
    return;
  }
  setLoading(true);
  setError(null);

  try {
    const res = await fetch("/api/paywithprepay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payWithPrePayUrl: response.Links.PayWithPrePay }),
    });
    const data = await res.json();

    // Always show the response on screen
    setResponse(data);

    if (data.redirectUrl) {
      window.open(data.redirectUrl, "_blank");
    } else if (data.error) {
      setError(data.error);
    } else if (data.message) {
      // Show info messages (like payment already made)
      setError(data.message);
    } else {
      setError("No redirect URL returned, but payment request was sent. See response below.");
    }
  } catch (err: any) {
    setError(err.message || "Unknown error");
  } finally {
    setLoading(false);
  }
};

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!order) return <p>Loading payload…</p>;

  return (
    <div className={styles.preview}>
      <h1>Preview Order</h1>
      <section>
        <h2>Full JSON Payload</h2>
        <pre style={{ whiteSpace: "pre-wrap", maxHeight: "300px", overflow: "auto" }}>
          {JSON.stringify(order, null, 2)}
        </pre>
      </section>
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <button onClick={handleCreate} disabled={loading} className={styles.button}>
          {loading ? "Creating…" : "Create Order on P2G"}
        </button>
        {response?.Links?.PayWithPrePay && (
          <button
            onClick={handlePrePay}
            disabled={loading}
            className={styles.button}
            type="button"
          >
            {loading ? "Processing…" : "Pay Shipment with PrePay"}
          </button>
        )}
      </div>
      {response && (
        <section>
          <h2>Response</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
