import rocketfyAPI from "../config/rocketfy.js";

export const getOrders = async () => {
  try {
    const response = await rocketfyAPI.get("/orders");
    return response.data;
  } catch (error) {
    console.error("Error al obtener órdenes de Rocketfy:", error.response?.data || error.message);
    throw error;
  }
};

export default async function getProducts() {
    try {
      const response = await rocketfyAPI.get("/products");
      return response.data;
    } catch (error) {
      console.error("Error al obtener productos:", error.response?.data || error.message);
      throw error;
    }
  }