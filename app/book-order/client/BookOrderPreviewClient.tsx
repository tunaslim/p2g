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
  const [label4x6Url, setLabel4x6Url] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

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
    setLabel4x6Url(null);
    setTrackingNumber(null);

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

      let label4x6 = null;
      if (data.data && Array.isArray(data.data.Links)) {
        const found = data.data.Links.find((l: any) => l.Name === "labels-4x6");
        if (found) label4x6 = found.Link;
      }

      if (label4x6) {
        setLabel4x6Url(label4x6); // store for later
      } else {
        setError(
          "No 4x6 label found in the response. Raw response: " +
            JSON.stringify(data, null, 2)
        );
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleGetTrackingNumber = async () => {
    if (!response?.OrderId) {
      setError("No OrderId available.");
      return;
    }
    setTrackingLoading(true);
    setError(null);
    setTrackingNumber(null);

    try {
      const res = await fetch("/api/get-tracking-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: response.OrderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);

      if (data.TrackingNumbers && data.TrackingNumbers.length > 0) {
        setTrackingNumber(data.TrackingNumbers[0].TrackingNumber);
      } else {
        setError("No tracking number returned.");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setTrackingLoading(false);
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
        {label4x6Url && (
          <>
            <button
              className={styles.button}
              onClick={() => window.open(label4x6Url, "_blank")}
              type="button"
              style={{ marginLeft: 12 }}
            >
              Download 4x6 Label
            </button>
            <button
              className={styles.button}
              onClick={handleGetTrackingNumber}
              disabled={trackingLoading}
              style={{ marginLeft: 12 }}
            >
              {trackingLoading ? "Getting Tracking…" : "Get Tracking Number"}
            </button>
          </>
        )}
      </div>
      {trackingNumber && (
        <div style={{ marginTop: 16 }}>
          <strong>Tracking Number:</strong> {trackingNumber}
        </div>
      )}
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
