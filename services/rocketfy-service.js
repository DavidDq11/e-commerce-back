import rocketfyAPI from "../config/rocketfy.js";

// Map Rocketfy categories to your database categories
const rocketfyCategoryMap = {
  "Hogar": "Accesorio", // Map "Hogar" to "Accesorio" or another relevant category in your app
  "Hogar y Muebles": "Accesorio", // Adjust based on your needs
  "Cocina": "Accesorio", // Map "Cocina" (a child category) to your category
  // Add more mappings as needed
};

// Transformation function for Rocketfy products
const transformRocketfyProduct = (product, index) => {
    // Extract category name from the category object
    const categoryName = product.category?.name || "Sin categoría";
    const mappedCategory = rocketfyCategoryMap[categoryName] || "Accesorio"; // Default to "Accesorio" if no mapping
  
    // Extract image URLs, filter out null values
    const imageUrls = product.images?.map((image) => image?.url).filter((url) => url != null) || [];
  
    return {
      id: `rocketfy-${index}`, // Use the index to create a unique ID
      title: product.name || "Producto Rocketfy",
      description: product.description || "Sin descripción",
      category: mappedCategory,
      type: product.type === "simple" ? "Producto Simple" : "Producto Variable",
      sizes: product.sizes || [],
      images: imageUrls,
      stock: product.stock || "In stock",
      price: Number(product.price) || 0,
      prevprice: product.prevprice ? Number(product.prevprice) : 0,
      qty: product.qty || 0,
      discount: product.discount || 0,
      totalprice: product.totalprice || Number(product.price) || 0,
      rating: {
        rate: product.rating?.rate || 0,
        count: product.rating?.count || 0,
      },
      source: "Rocketfy", // Add a source field to identify Rocketfy products
    };
  };

export const getOrders = async () => {
  try {
    const response = await rocketfyAPI.get("/orders");
    return response.data;
  } catch (error) {
    console.error("Error al obtener órdenes de Rocketfy:", error.response?.data || error.message);
    throw error;
  }
};

export const getProducts = async () => {
    try {
      const response = await rocketfyAPI.get("/products");
      console.log('Respuesta de Rocketfy API:', response.data); // Verifica la respuesta cruda
      const transformedProducts = response.data.map((product, index) =>
        transformRocketfyProduct(product, index)
      );
      console.log('Productos transformados de Rocketfy:', transformedProducts); // Verifica después de transformar
      return transformedProducts;
    } catch (error) {
      console.error("Error al obtener productos de Rocketfy:", error.response?.data || error.message);
      throw error;
    }
  };

export default getProducts;