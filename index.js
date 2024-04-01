const express = require("express");
const app = express();

const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// middelware
app.use(cors());
app.use(express.json());

// saadafahmed45;
// Swg9Q3gK7WUTcMGu;
// mongodb setting here
// env

const port = process.env.PORT || 5000;
const dbUserName = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

console.log(dbUserName, dbPassword);

const uri = `mongodb+srv://${dbUserName}:${dbPassword}@cluster0.58zpnyp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("productsDb");
    const productCollection = database.collection("products");

    // get

    app.get("/products", async (req, res) => {
      const cusor = productCollection.find();
      const result = await cusor.toArray();
      res.send(result);
    });

    // post

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
      console.log(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("this is ira fashion Database");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// // Define a route to handle POST requests to add products
// app.post("/products", async (req, res) => {
//   try {
//     // Extract products array from request body
//     // const products = req.body;

//     // Insert the array of products into the MongoDB collection
//     const result = await client
//       .db("productsDb")
//       .collection("products")
//       .insertMany(products);

//     // Respond with the newly created products
//     res.status(201).json(result.ops);
//   } catch (error) {
//     console.error("Error adding products:", error);
//     res.status(500).json({ error: "Failed to add products" });
//   }
// });
