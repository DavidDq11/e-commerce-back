import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const rocketfyAPI = axios.create({
  baseURL: 'https://ms-public-api.rocketfy.com/rocketfy/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ROCKETFY_API_KEY,
    'x-secret': process.env.ROCKETFY_SECRET,
  },
});


export default rocketfyAPI;
