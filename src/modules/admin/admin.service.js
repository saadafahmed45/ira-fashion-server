const Order = require("../orders/order.model");
const Product = require("../products/product.model");
const User = require("../users/user.model");

class AdminService {
  async getDashboardMetrics() {
    const totalSalesAgg = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]);
    const totalRevenue = totalSalesAgg[0]?.total || 0;

    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    const topProducts = await Product.find().sort({ totalSold: -1 }).limit(5);

    // Sales over last 7 days aggregation for Recharts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesChart = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$pricing.total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      summary: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
      },
      recentOrders,
      topProducts,
      salesChart: salesChart.map((item) => ({
        date: item._id,
        sales: item.sales,
        orders: item.orders,
      })),
    };
  }
}

module.exports = new AdminService();
