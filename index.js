require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const app = express();
const port = process.env.PORT || 5000;

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// CLOUDINARY CONFIG
// =======================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =======================
// MULTER STORAGE
// =======================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ira-fashion",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });

// =======================
// MONGODB CONNECTION
// =======================
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.58zpnyp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

// Helper: Check valid ObjectId
const isValidObjectId = (id) => {
  try {
    return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
  } catch {
    return false;
  }
};

// Helper: Parse IDs from either comma-separated string or JSON array string
const parseIds = (raw) => {
  if (!raw) return [];
  try {
    // Try JSON array first
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((id) => String(id).trim()).filter(isValidObjectId).map((id) => new ObjectId(id));
    }
  } catch {
    // Fall back to comma-separated
  }
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(isValidObjectId)
    .map((id) => new ObjectId(id));
};

async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected");

    const db = client.db("productsDb");
    const productCollection = db.collection("products");
    const collectionCollection = db.collection("collections");

    // =========================
    // 🔥 PRODUCTS CRUD
    // =========================

    // Create Product
    app.post("/products", upload.array("images", 5), async (req, res) => {
      try {
        const imageUrls = req.files?.map((f) => f.path) || [];

        // Accept both "collectionIds" and "collections" field names
        const rawIds = req.body.collectionIds || req.body.collections || "";
        const collectionIds = parseIds(rawIds);

        const product = {
          title: req.body.title || "",
          description: req.body.description || "",
          price: Number(req.body.price) || 0,
          vendor: req.body.vendor || "",
          productType: req.body.productType || "",
          tags: req.body.tags ? req.body.tags.split(",").map((t) => t.trim()) : [],
          variants: req.body.variants ? JSON.parse(req.body.variants) : [],
          sku: req.body.sku || "",
          barcode: req.body.barcode || "",
          weight: Number(req.body.weight) || 0,
          status: req.body.status || "draft",
          images: imageUrls,
          collectionIds,
          createdAt: new Date(),
        };

        const result = await productCollection.insertOne(product);

        // Update collections with this product
        if (collectionIds.length > 0) {
          await collectionCollection.updateMany(
            { _id: { $in: collectionIds } },
            { $addToSet: { productIds: result.insertedId } }
          );
        }

        res.status(201).json({ success: true, insertedId: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Product upload failed", error: err.message });
      }
    });

    // Get all Products
    app.get("/products", async (req, res) => {
      try {
        const products = await productCollection.find().sort({ createdAt: -1 }).toArray();
        res.json(products);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch products" });
      }
    });

    // Get single Product
    app.get("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid product id" });

        const product = await productCollection.findOne({ _id: new ObjectId(id) });
        if (!product) return res.status(404).json({ message: "Product not found" });

        res.json(product);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch product" });
      }
    });

    // Update Product — accepts multipart/form-data OR application/json
    app.put("/products/:id", upload.array("images", 5), async (req, res) => {
      try {
        const id = req.params.id;
        if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid product id" });

        const filter = { _id: new ObjectId(id) };
        const imageUrls = req.files?.map((f) => f.path);

        const rawIds = req.body.collectionIds || req.body.collections || "";
        const collectionIds = parseIds(rawIds);

        const updatedData = {
          updatedAt: new Date(),
        };

        // Only update fields that are present in the request
        if (req.body.title !== undefined) updatedData.title = req.body.title;
        if (req.body.description !== undefined) updatedData.description = req.body.description;
        if (req.body.price !== undefined) updatedData.price = Number(req.body.price);
        if (req.body.productType !== undefined) updatedData.productType = req.body.productType;
        if (req.body.vendor !== undefined) updatedData.vendor = req.body.vendor;
        if (req.body.variants !== undefined) updatedData.variants = JSON.parse(req.body.variants);
        if (req.body.status !== undefined) updatedData.status = req.body.status;
        if (collectionIds.length > 0) updatedData.collectionIds = collectionIds;
        if (imageUrls?.length > 0) updatedData.images = imageUrls;

        const result = await productCollection.updateOne(filter, { $set: updatedData });

        // Sync collections
        if (collectionIds.length > 0) {
          await collectionCollection.updateMany(
            { _id: { $in: collectionIds } },
            { $addToSet: { productIds: new ObjectId(id) } }
          );
        }

        res.json({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Update failed", error: err.message });
      }
    });

    // Delete Product
    app.delete("/products/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid product id" });

        const result = await productCollection.deleteOne({ _id: new ObjectId(id) });

        // Remove product from collections
        await collectionCollection.updateMany(
          { productIds: new ObjectId(id) },
          { $pull: { productIds: new ObjectId(id) } }
        );

        res.json({ success: true, result });
      } catch (err) {
        res.status(500).json({ message: "Delete failed" });
      }
    });

    // =========================
    // 🔥 COLLECTIONS CRUD
    // =========================

    // Create Collection
    app.post("/collections", upload.single("image"), async (req, res) => {
      try {
        const imageUrl = req.file?.path || "";

        const rawIds = req.body.productIds || "";
        const productIds = parseIds(rawIds);

        const collection = {
          name: req.body.name || "",
          description: req.body.description || "",
          imageUrl,
          productIds,
          createdAt: new Date(),
        };

        const result = await collectionCollection.insertOne(collection);

        // Update products with this collection
        if (productIds.length > 0) {
          await productCollection.updateMany(
            { _id: { $in: productIds } },
            { $addToSet: { collectionIds: result.insertedId } }
          );
        }

        res.status(201).json({ success: true, insertedId: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create collection", error: err.message });
      }
    });

    // Get all Collections
    app.get("/collections", async (req, res) => {
      try {
        const collections = await collectionCollection.find().sort({ createdAt: -1 }).toArray();
        res.json(collections);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch collections" });
      }
    });

    // Get single Collection
    app.get("/collections/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid collection id" });

        const collection = await collectionCollection.findOne({ _id: new ObjectId(id) });
        if (!collection) return res.status(404).json({ message: "Collection not found" });

        res.json(collection);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch collection" });
      }
    });

    // Update Collection
    app.put("/collections/:id", upload.single("image"), async (req, res) => {
      try {
        const id = req.params.id;
        if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid collection id" });

        const filter = { _id: new ObjectId(id) };

        const rawIds = req.body.productIds || "";
        const productIds = parseIds(rawIds);

        const updatedData = {
          updatedAt: new Date(),
        };

        if (req.body.name !== undefined) updatedData.name = req.body.name;
        if (req.body.description !== undefined) updatedData.description = req.body.description;
        updatedData.productIds = productIds;
        if (req.file?.path) updatedData.imageUrl = req.file.path;

        // Get old product IDs to remove stale references
        const oldCollection = await collectionCollection.findOne(filter);
        const oldProductIds = oldCollection?.productIds || [];

        const result = await collectionCollection.updateOne(filter, { $set: updatedData });

        // Remove this collection from products that were deselected
        const removedProductIds = oldProductIds.filter(
          (oldId) => !productIds.some((newId) => newId.toString() === oldId.toString())
        );
        if (removedProductIds.length > 0) {
          await productCollection.updateMany(
            { _id: { $in: removedProductIds } },
            { $pull: { collectionIds: new ObjectId(id) } }
          );
        }

        // Add this collection to newly selected products
        if (productIds.length > 0) {
          await productCollection.updateMany(
            { _id: { $in: productIds } },
            { $addToSet: { collectionIds: new ObjectId(id) } }
          );
        }

        res.json({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update collection", error: err.message });
      }
    });

    // Delete Collection
    app.delete("/collections/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid collection id" });

        const result = await collectionCollection.deleteOne({ _id: new ObjectId(id) });

        // Remove collection from products
        await productCollection.updateMany(
          { collectionIds: new ObjectId(id) },
          { $pull: { collectionIds: new ObjectId(id) } }
        );

        res.json({ success: true, result });
      } catch (err) {
        res.status(500).json({ message: "Failed to delete collection" });
      }
    });




    // =========================
// 🔥 ORDERS API FULL
// =========================

const orderCollection = db.collection("orders");

// Create Order
app.post("/orders", async (req, res) => {
  try {
    const order = {
      customerName: req.body.customerName,
      email: req.body.email,
      products: req.body.products || [],
      totalPrice: Number(req.body.totalPrice) || 0,
      status: "Pending",
      createdAt: new Date(),
    };

    const result = await orderCollection.insertOne(order);

    res.status(201).json({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({
      message: "Order failed",
      error: err.message,
    });
  }
});

// Get Orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await orderCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json(orders);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});

// Update Order Status
app.patch("/orders/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await orderCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: req.body.status } }
    );

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({
      message: "Update failed",
    });
  }
});

// Delete Order (optional)
app.delete("/orders/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await orderCollection.deleteOne({
      _id: new ObjectId(id),
    });

    res.json({ success: true, result });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});
    // =========================
    // 🔥 STATS ENDPOINT
    // =========================
    app.get("/stats", async (req, res) => {
      try {
        const [totalProducts, totalCollections, activeProducts, draftProducts] = await Promise.all([
          productCollection.countDocuments(),
          collectionCollection.countDocuments(),
          productCollection.countDocuments({ status: "active" }),
          productCollection.countDocuments({ status: "draft" }),
        ]);

        const recentProducts = await productCollection
          .find()
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray();

        res.json({ totalProducts, totalCollections, activeProducts, draftProducts, recentProducts });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch stats" });
      }
    });

  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}

run();

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});