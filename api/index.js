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
      scope: 'public-api',
      client_id: process.env.PARCEL2GO_CLIENT_ID,
      client_secret: process.env.PARCEL2GO_CLIENT_SECRET,
    });

    const tokenUrl = 'https://www.parcel2go.com/auth/connect/token';

    // Log request details
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

app.post('/get-quote', async (req, res) => {
  try {
    const { order } = req.body;

    // Get access token
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

app.post('/create-label', async (req, res) => {
  try {
    const { labelData } = req.body;

    const token = await getParcel2GoToken();

    const response = await axios.post('https://www.parcel2go.com/api/shipments', labelData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Parcel2Go API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create label', details: error.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
