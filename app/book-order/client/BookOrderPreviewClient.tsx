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
  const [orderCreated, setOrderCreated] = useState(false);
  const [prepayDone, setPrepayDone] = useState(false);

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
    setPrepayDone(false);
    setOrderCreated(false);

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setResponse(data);
      setOrderCreated(true); // Disable the button
    } catch (err: any) {
      setError(err.message);
      setOrderCreated(false);
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
    setLabel4x6Url(null);

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
        setPrepayDone(true);
      } else {
        setError(
          "No 4x6 label found in the response. Raw response: " +
            JSON.stringify(data, null, 2)
        );
        setPrepayDone(false);
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setPrepayDone(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGetTracking = async () => {
    if (!response?.OrderId) {
      setError("No OrderId available.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/get-tracking-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: response.OrderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);

      if (
        data.TrackingNumbers &&
        Array.isArray(data.TrackingNumbers) &&
        data.TrackingNumbers[0]?.TrackingNumber
      ) {
        setTrackingNumber(data.TrackingNumbers[0].TrackingNumber);
      } else {
        setError(
          "No tracking number found. Raw response: " +
            JSON.stringify(data, null, 2)
        );
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
        <button
          onClick={handleCreate}
          disabled={loading || orderCreated}
          className={styles.button}
        >
          {loading
            ? "Creating…"
            : orderCreated
            ? "Order Created"
            : "Create Order on P2G"}
        </button>
        {response?.Links?.PayWithPrePay && (
          <button
            onClick={handlePrePay}
            disabled={loading || prepayDone}
            className={styles.button}
            type="button"
          >
            {loading
              ? "Processing…"
              : prepayDone
              ? "Paid"
              : "Pay Shipment with PrePay"}
          </button>
        )}
        {label4x6Url && (
          <button
            className={styles.button}
            onClick={() => window.open(label4x6Url, "_blank")}
            type="button"
            style={{ marginLeft: 12 }}
          >
            Download 4x6 Label
          </button>
        )}
        {response?.OrderId && prepayDone && (
          <button
            className={styles.button}
            onClick={handleGetTracking}
            disabled={loading || !!trackingNumber}
            type="button"
            style={{ marginLeft: 12 }}
          >
            {loading
              ? "Getting Tracking…"
              : trackingNumber
              ? "Tracking Acquired"
              : "Get Tracking Number"}
          </button>
        )}
      </div>
      {trackingNumber && (
        <section style={{ marginTop: 12 }}>
          <strong>Tracking Number: </strong>
          <span style={{ fontSize: "1.15em" }}>{trackingNumber}</span>
        </section>
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
