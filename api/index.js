const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Parcel2Go API is running 🚀');
});

// Get OAuth2 token from Parcel2Go (Production) with logging
async function getParcel2GoToken() {
  try {
    const payload = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'public-api payment',
      client_id: process.env.PARCEL2GO_CLIENT_ID,
      client_secret: process.env.PARCEL2GO_CLIENT_SECRET,
    });

    const tokenUrl = 'https://www.parcel2go.com/auth/connect/token';

    console.log('Sending token request to:', tokenUrl);
    console.log('Request payload:', payload.toString());
    console.log('Request headers:', {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'insomnia/5.14.6',
      'Accept': '*/*',
    });

    const response = await axios.post(tokenUrl, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'insomnia/5.14.6',
        'Accept': '*/*',
      },
    });

    console.log('Token response:', response.data);
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get Parcel2Go token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Parcel2Go');
  }
}

// Quote endpoint
app.post('/get-quote', async (req, res) => {
  try {
    const { order } = req.body;
    const token = await getParcel2GoToken();

    const quoteUrl = 'https://www.parcel2go.com/api/quotes';
    console.log('Sending quote request to:', quoteUrl);
    console.log('Quote request payload:', JSON.stringify(order, null, 2));

    const response = await axios.post(quoteUrl, order, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Quote response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Parcel2Go API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get quote', details: error.response?.data || error.message });
  }
});

// Create Order endpoint
app.post('/create-order', async (req, res) => {
  try {
    const { order } = req.body;
    const token = await getParcel2GoToken();

    const orderUrl = 'https://www.parcel2go.com/api/orders';
    console.log('Sending order request to:', orderUrl);
    console.log('Order request payload:', JSON.stringify(order, null, 2));

    const response = await axios.post(orderUrl, order, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Order response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Parcel2Go API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create order', details: error.response?.data || error.message });
  }
});

app.post('/paywithprepay', async (req, res) => {
  try {
    const { payWithPrePayUrl } = req.body;
    if (!payWithPrePayUrl) {
      return res.status(400).json({ error: 'Missing payWithPrePayUrl' });
    }

    const token = await getParcel2GoToken();

    const response = await axios.post(
      payWithPrePayUrl,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      }
    );

    // Just return the whole response object (headers, data, status, etc.)
    return res.json({
      status: response.status,
      headers: response.headers,
      data: response.data,
    });

  } catch (error) {
    if (error.response) {
      // If there was an HTTP error, return the details for debugging
      return res.status(error.response.status).json({
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
        message: error.message,
      });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/get-tracking-number', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    const token = await getParcel2GoToken();

    const url = `https://www.parcel2go.com/api/orders/${orderId}/parcelnumbers`;

    const response = await axios.post(
      url,
      {}, // No body required
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    // Just forward the response data
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.error('Failed to get tracking number:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
      });
      res.status(error.response.status || 500).json({
        error: error.response.data?.error || 'Failed to get tracking number',
        details: error.response.data,
      });
    } else {
      console.error('Failed to get tracking number:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
