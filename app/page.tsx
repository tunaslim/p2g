'use client';

import { useState, useEffect } from 'react';
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

export default function Home() {
  // Helm Orders states
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Parcel2Go states
  const [order, setOrder] = useState({
    CollectionAddress: { Country: '', Property: '', Postcode: '', Town: '', VatStatus: 'Individual' },
    DeliveryAddress: { Country: '', Property: '', Postcode: '', Town: '', VatStatus: 'Individual' },
    Parcels: [{ Value: '', Weight: '', Length: '', Width: '', Height: '' }],
    Extras: [] as any[],
    IncludedDropShopDistances: false,
    ServiceFilter: { IncludeServiceTags: [] as string[], ExcludeServiceTags: [] as string[] },
  });

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Quote | null>(null);
  const [label, setLabel] = useState<LabelResponse | null>(null);
  const [error, setError] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: number]: boolean }>({});

  const apiBase = 'https://p2g-api.up.railway.app';

  // Fetch Helm orders
  const fetchOrders = async (authToken: string) => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const response = await axios.get('https://goodlife.myhelm.app/public-api/orders?page=1&sort=name_az', {
