import axios from 'axios';

export async function login(email, password) {
  try {
    const response = await axios.post('https://goodlife.myhelm.app/public-api/auth/login', {
      email,
      password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data.token;
  } catch (error) {
    throw new Error('Login failed: ' + error.message);
  }
}
