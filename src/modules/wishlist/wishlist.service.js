const wishlistRepository = require("./wishlist.repository");

class WishlistService {
  async getWishlist(userId) {
    let wishlist = await wishlistRepository.findByUserId(userId);
    if (!wishlist) {
      wishlist = { userId, products: [] };
    }
    return wishlist;
  }

  async addToWishlist(userId, productId) {
    return await wishlistRepository.addProduct(userId, productId);
  }

  async removeFromWishlist(userId, productId) {
    return await wishlistRepository.removeProduct(userId, productId);
  }
}

module.exports = new WishlistService();
