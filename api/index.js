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

// **New**: Create Order endpoint
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

    const redirectUrl =
      response.headers.location ||
      response.headers.Location ||
      null;

if (redirectUrl) {
  return res.json({ payWithPrePayUrl: redirectUrl });
} else if (
  response.data &&
  (
    (response.data.Message && response.data.Message.toLowerCase().includes('already paid')) ||
    (response.data.Message && response.data.Message.toLowerCase().includes('success'))
  )
) {
  // Inform the frontend that payment has already been made
  return res.json({ message: response.data.Message || 'Payment already completed on Parcel2Go.' });
} else {
  // Log for debugging
  console.error('Parcel2Go paywithprepay response:', {
    status: response.status,
    headers: response.headers,
    data: response.data,
  });
  return res.status(500).json({
    error: 'No PayWithPrePay URL returned from Parcel2Go',
    debug: {
      status: response.status,
      headers: response.headers,
      data: response.data,
    }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
