import axios from 'axios';

export async function getOrders(token, page = 1) {
  try {
    const response = await axios.get(`https://goodlife.myhelm.app/public-api/orders?page=${page}&sort=name_az`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.orders;
  } catch (error) {
    throw new Error('Fetching orders failed: ' + error.message);
  }
}
