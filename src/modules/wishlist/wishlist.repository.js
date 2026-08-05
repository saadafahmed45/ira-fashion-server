const Wishlist = require("./wishlist.model");

class WishlistRepository {
  async findByUserId(userId) {
    return await Wishlist.findOne({ userId }).populate("products");
  }

  async addProduct(userId, productId) {
    return await Wishlist.findOneAndUpdate(
      { userId },
      { $addToSet: { products: productId } },
      { new: true, upsert: true }
    ).populate("products");
  }

  async removeProduct(userId, productId) {
    return await Wishlist.findOneAndUpdate(
      { userId },
      { $pull: { products: productId } },
      { new: true }
    ).populate("products");
  }
}

module.exports = new WishlistRepository();
