require("dotenv").config();
const mongoose = require("mongoose");
const slugify = require("slugify");
const connectDB = require("../config/db");

const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Review = require("../models/Review");
const Order = require("../models/Order");

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("🚀 Starting database seeding...");

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log("🧹 Cleared existing database records.");

    // 1. Create Users
    const adminUser = await User.create({
      name: "Ira Admin",
      email: "admin@irafashion.com",
      password: "Admin@123456",
      role: "admin",
      status: "active",
      addresses: [
        {
          street: "House 12, Road 5, Dhanmondi",
          city: "Dhaka",
          state: "Dhaka",
          zip: "1205",
          country: "Bangladesh",
          phone: "+8801711000001",
          isDefault: true,
        },
      ],
    });

    const customerUser = await User.create({
      name: "Fatima Noor",
      email: "customer@irafashion.com",
      password: "Customer@123456",
      role: "user",
      status: "active",
      addresses: [
        {
          street: "Block C, Bashundhara R/A",
          city: "Dhaka",
          state: "Dhaka",
          zip: "1229",
          country: "Bangladesh",
          phone: "+8801811000002",
          isDefault: true,
        },
      ],
    });

    console.log("👤 Created Admin and Customer accounts.");

    // 2. Create Categories
    const categoriesData = [
      {
        name: "Dresses",
        slug: "dresses",
        description: "Elegant evening, casual, and formal dresses tailored to perfection.",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80",
        isActive: true,
      },
      {
        name: "Abayas & Modest Wear",
        slug: "abayas-modest-wear",
        description: "Timeless, luxurious modest wear crafted from premium Dubai Nida fabrics.",
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
        isActive: true,
      },
      {
        name: "Tops & Tunics",
        slug: "tops-tunics",
        description: "Chic contemporary tops, georgette tunics, and stylish everyday silhouettes.",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
        isActive: true,
      },
      {
        name: "Sarees & Traditional",
        slug: "sarees-traditional",
        description: "Breathtaking silk, jamdani, and organza sarees for memorable occasions.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
        isActive: true,
      },
      {
        name: "Accessories & Hijabs",
        slug: "accessories-hijabs",
        description: "Premium modal hijabs, designer clutches, pins, and modest accessories.",
        image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80",
        isActive: true,
      },
    ];

    const categories = await Category.insertMany(categoriesData);
    console.log(`📁 Created ${categories.length} categories.`);

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.slug] = cat._id;
    });

    // 3. Create Products
    const productsData = [
      {
        name: "Midnight Blossom Silk Maxi Dress",
        description: "Crafted from lustrous mulberry silk blend with intricate floral embroidery along the cuffs and neckline. Features a relaxed waist cincher and flared silhouette.",
        price: 3450,
        discountPrice: 2950,
        category: catMap["dresses"],
        brand: "Ira Exclusive",
        stock: 25,
        images: [
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: true,
        status: "active",
      },
      {
        name: "Emerald Green Satin Wrap Gown",
        description: "Sophisticated satin wrap gown with fluid drape and delicate bishop sleeves. Perfect for festive celebrations and evening gatherings.",
        price: 4200,
        discountPrice: 3800,
        category: catMap["dresses"],
        brand: "Ira Elegance",
        stock: 18,
        images: [
          "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: true,
        status: "active",
      },
      {
        name: "Royal Dubai Nida Embroidered Abaya",
        description: "Tailored from original Dubai Royal Nida fabric with hand-placed crystal and resham thread embroidery. Comes with matching Sheila hijab.",
        price: 5500,
        discountPrice: 4850,
        category: catMap["abayas-modest-wear"],
        brand: "Ira Modest",
        stock: 30,
        images: [
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: true,
        status: "active",
      },
      {
        name: "Pearl White Layered Open Abaya",
        description: "A two-piece layered open front abaya in rich pearl tone with feather-light organza outer layer. Designed for statement modest elegance.",
        price: 4900,
        discountPrice: 0,
        category: catMap["abayas-modest-wear"],
        brand: "Ira Modest",
        stock: 12,
        images: [
          "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: false,
        status: "active",
      },
      {
        name: "Sage Pleated Georgette Tunic",
        description: "Contemporary pleated tunic in calming sage green with mandarin collar and mother-of-pearl buttons. Pairs seamlessly with tailored trousers.",
        price: 2150,
        discountPrice: 1850,
        category: catMap["tops-tunics"],
        brand: "Ira Studio",
        stock: 40,
        images: [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: true,
        status: "active",
      },
      {
        name: "Dusty Rose Peplum Blouse",
        description: "Feminine peplum silhouette cut from premium textured crepe with subtle flared cuffs and back tie belt.",
        price: 1850,
        discountPrice: 1550,
        category: catMap["tops-tunics"],
        brand: "Ira Studio",
        stock: 35,
        images: [
          "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: false,
        status: "active",
      },
      {
        name: "Handwoven Royal Blue Katan Silk Saree",
        description: "Pure Katan silk saree woven by master artisans with intricate antique zari borders and grand pallu work. Comes with unstitched blouse piece.",
        price: 8500,
        discountPrice: 7200,
        category: catMap["sarees-traditional"],
        brand: "Ira Heritage",
        stock: 8,
        images: [
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: true,
        status: "active",
      },
      {
        name: "Vintage Pastel Jamdani Organza Saree",
        description: "Feather-light organza saree adorned with delicate jamdani motifs in soft pastel hues. An ethereal masterpiece for daytime festivities.",
        price: 6800,
        discountPrice: 5900,
        category: catMap["sarees-traditional"],
        brand: "Ira Heritage",
        stock: 14,
        images: [
          "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: true,
        status: "active",
      },
      {
        name: "Ultra-Soft Modal Silk Hijab in Mocha",
        description: "Luxuriously breathable modal silk hijab featuring a non-slip textured weave and lightweight flow. Effortless styling for every day.",
        price: 650,
        discountPrice: 550,
        category: catMap["accessories-hijabs"],
        brand: "Ira Accents",
        stock: 100,
        images: [
          "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: false,
        status: "active",
      },
      {
        name: "Embroidered Velvet Festive Clutch",
        description: "Opulent handcrafted evening clutch in midnight navy velvet with hand-sewn metallic zardozi and bead embellishments.",
        price: 1950,
        discountPrice: 1650,
        category: catMap["accessories-hijabs"],
        brand: "Ira Accents",
        stock: 22,
        images: [
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: false,
        status: "active",
      },
      {
        name: "Bohemian Tiered Ruffle Maxi",
        description: "Whimsical tiered maxi with smocked bodice and adjustable tie shoulders. Light, breezy chiffon fabric lined with breathable cotton.",
        price: 2850,
        discountPrice: 0,
        category: catMap["dresses"],
        brand: "Ira Studio",
        stock: 20,
        images: [
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: false,
        status: "active",
      },
      {
        name: "Classic Kimono Sleeve Linen Abaya",
        description: "Minimalist everyday abaya featuring clean Japanese kimono sleeves in washed stone linen. Built for maximum comfort and modest poise.",
        price: 3800,
        discountPrice: 3200,
        category: catMap["abayas-modest-wear"],
        brand: "Ira Modest",
        stock: 15,
        images: [
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        ],
        isFeatured: false,
        status: "active",
      },
    ];

    const productsWithSlugs = productsData.map((p, idx) => ({
      ...p,
      slug: slugify(p.name, { lower: true, strict: true }) + "-" + (1000 + idx),
    }));

    const createdProducts = await Product.insertMany(productsWithSlugs);
    console.log(`👗 Created ${createdProducts.length} products.`);

    // 4. Create Coupons
    const couponsData = [
      {
        code: "WELCOME10",
        discountType: "percentage",
        amount: 10,
        minPurchase: 1000,
        maxDiscount: 500,
        expiryDate: new Date("2028-12-31"),
        isActive: true,
      },
      {
        code: "SAVE200",
        discountType: "fixed",
        amount: 200,
        minPurchase: 1500,
        expiryDate: new Date("2028-12-31"),
        isActive: true,
      },
      {
        code: "FASHION20",
        discountType: "percentage",
        amount: 20,
        minPurchase: 3000,
        maxDiscount: 1000,
        expiryDate: new Date("2028-12-31"),
        isActive: true,
      },
    ];

    await Coupon.insertMany(couponsData);
    console.log("🎟️ Created active promotional coupons.");

    // 5. Create Sample Reviews
    const reviewsData = [
      {
        product: createdProducts[0]._id,
        user: customerUser._id,
        rating: 5,
        comment: "The silk quality is unbelievable! Fits true to size and feels like pure luxury.",
        isApproved: true,
      },
      {
        product: createdProducts[2]._id,
        user: customerUser._id,
        rating: 5,
        comment: "Stunning craftsmanship on the embroidery. Will definitely order again from Ira Fashion!",
        isApproved: true,
      },
      {
        product: createdProducts[4]._id,
        user: customerUser._id,
        rating: 4,
        comment: "Great quality georgette tunic, the color is slightly darker than the photo but beautiful.",
        isApproved: true,
      },
    ];

    for (const r of reviewsData) {
      await Review.create(r);
    }
    console.log("⭐ Created verified reviews.");

    // 6. Create Initial COD Order
    await Order.create({
      user: customerUser._id,
      orderItems: [
        {
          product: createdProducts[0]._id,
          name: createdProducts[0].name,
          image: createdProducts[0].images[0],
          price: createdProducts[0].discountPrice || createdProducts[0].price,
          quantity: 1,
        },
      ],
      shippingAddress: customerUser.addresses[0],
      paymentMethod: "COD",
      paymentStatus: "Pending",
      orderStatus: "Processing",
      itemsPrice: 2950,
      shippingPrice: 0,
      taxPrice: 0,
      discountAmount: 0,
      totalPrice: 2950,
      notes: "Please call before delivery",
    });
    console.log("📦 Created initial test COD order.");

    console.log("\n==========================================");
    console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("Admin Credentials: admin@irafashion.com / Admin@123456");
    console.log("Customer Credentials: customer@irafashion.com / Customer@123456");
    console.log("==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
