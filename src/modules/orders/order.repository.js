const Order = require("./order.model");
const QueryBuilder = require("../../common/utils/queryBuilder");

class OrderRepository {
  async findAll(queryParams) {
    const allowedFilters = ["status", "paymentStatus", "paymentMethod"];
    const builder = new QueryBuilder(Order, queryParams);

    return await builder
      .search(["orderNumber", "customer.name", "customer.email", "customer.phone"])
      .filterByFields(allowedFilters)
      .execute();
  }

  async findByUserId(userId, queryParams) {
    const builder = new QueryBuilder(Order, { ...queryParams, "customer.userId": userId });
    return await builder
      .filterByFields(["status", "paymentStatus"])
      .execute();
  }

  async findById(id) {
    return await Order.findById(id).populate("products.productId");
  }

  async findByQuery(term) {
    const raw = term.trim();
    const upper = raw.toUpperCase();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(raw);

    const conditions = [
      { orderNumber: upper },
      { orderNumber: upper.startsWith("IRA-") ? upper : `IRA-${upper}` },
      { "customer.email": { $regex: `^${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: "i" } },
      { "customer.phone": { $regex: raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" } },
    ];

    if (isObjectId) {
      conditions.push({ _id: raw });
    }

    return await Order.find({ $or: conditions })
      .sort({ createdAt: -1 })
      .populate("products.productId");
  }

  async create(orderData) {
    const order = new Order(orderData);
    return await order.save();
  }

  async updateStatus(id, updateFields) {
    return await Order.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true });
  }

  async delete(id) {
    return await Order.findByIdAndDelete(id);
  }
}

module.exports = new OrderRepository();
