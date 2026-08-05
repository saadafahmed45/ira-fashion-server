const orderRepository = require("./order.repository");
const Product = require("../products/product.model");
const ApiError = require("../../common/errors/ApiError");

class OrderService {
  async getAllOrders(queryParams) {
    return await orderRepository.findAll(queryParams);
  }

  async getUserOrders(userId, queryParams) {
    return await orderRepository.findByUserId(userId, queryParams);
  }

  async getOrderById(id) {
    const order = await orderRepository.findById(id);
    if (!order) throw new ApiError(404, "Order not found");
    return order;
  }

  async trackOrder(query) {
    const orders = await orderRepository.findByQuery(query);
    if (!orders || orders.length === 0) {
      throw new ApiError(404, "No order found matching your search term (Order #, Email, Phone, or ID)");
    }
    // Return array if multiple orders matched (e.g. by email/phone), or single order object if 1 result
    return orders.length === 1 ? orders[0] : orders;
  }

  async createOrder(orderData, userId = null) {
    const orderNumber = `IRA-${Math.floor(100000 + Math.random() * 900000)}`;
    let subtotal = 0;
    const items = [];

    // Support both cartStore shape { _id, price, quantity } and full product objects
    const products = orderData.products || orderData.items || [];

    for (const item of products) {
      const productId = item.productId || item._id;
      const product = await Product.findById(productId);
      if (!product) throw new ApiError(404, `Product ${productId} not found`);

      const itemPrice = Number(item.price) || product.price;
      const qty = Number(item.quantity) || 1;
      subtotal += itemPrice * qty;

      items.push({
        productId: product._id,
        title: item.title || product.title,
        image: item.image || product.images?.[0] || "",
        price: itemPrice,
        quantity: qty,
        variant: item.variant || item.selectedVariant || null,
      });

      await Product.findByIdAndUpdate(product._id, { $inc: { totalSold: qty } });
    }

    const shipping = Number(orderData.pricing?.shipping ?? orderData.shippingCost ?? 0);
    const discount = Number(orderData.pricing?.discount ?? orderData.discount ?? 0);
    const total = subtotal + shipping - discount;

    const payload = {
      orderNumber,
      customer: {
        ...(userId && { userId }),
        name: orderData.customer?.name || orderData.name || "",
        email: orderData.customer?.email || orderData.email || "",
        phone: orderData.customer?.phone || orderData.phone || "",
      },
      shippingAddress: orderData.shippingAddress || {
        street: orderData.address || "",
        city: orderData.city || "",
        state: orderData.state || "",
        zip: orderData.zip || orderData.postalCode || "",
        country: orderData.country || "Bangladesh",
      },
      products: items,
      pricing: { subtotal, shipping, discount, total },
      paymentMethod: orderData.paymentMethod || "cod",
      notes: orderData.notes || "",
    };

    return await orderRepository.create(payload);
  }

  async updateOrderStatus(id, status, paymentStatus) {
    const updateFields = {};
    if (status) updateFields.status = status;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;
    const order = await orderRepository.updateStatus(id, updateFields);
    if (!order) throw new ApiError(404, "Order not found");
    return order;
  }

  async deleteOrder(id) {
    const order = await orderRepository.delete(id);
    if (!order) throw new ApiError(404, "Order not found");
    return order;
  }
}

module.exports = new OrderService();
