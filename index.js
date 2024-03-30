const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

// middelware
app.use(cors());
app.use(express.json());

const products = [
  {
    id: 1,
    name: "Shirt",
    img: "https://img.freepik.com/free-photo/sneakers-shoes_1203-8036.jpg?w=826&t=st=1711653722~exp=1711654322~hmac=62d1252f3d0124afe6011ecd0af35c9578d71ae66f4b1779affa95f23c081fb5",
    price: 999.99,
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed et molestie odio. Integer nec diam dui.",
  },
  {
    id: 2,
    name: "Pant",
    img: "https://img.freepik.com/free-photo/sport-new-lifestyle-fashion-sneakers_1203-6399.jpg?w=826&t=st=1711653670~exp=1711654270~hmac=66627b21b21a284b016aa3844aaad1f1e9cb096e77c13c403d74be896e5b2be2",
    price: 599.99,
    description:
      "Nullam feugiat, mauris sit amet convallis laoreet, metus mauris facilisis neque, sit amet ultricies purus sapien nec velit.",
  },
  {
    id: 3,
    name: "Ladis Tops",
    img: "https://img.freepik.com/free-photo/sport-shoes-running_1203-7550.jpg?w=826&t=st=1711653779~exp=1711654379~hmac=81ad6c96d35bf194b20d20bc783be464eed5d34bf67751f0b4cd04114d4bbde6",

    price: 149.99,
    description:
      "Fusce nec lorem at odio condimentum blandit. Integer lobortis turpis eget mi rutrum, et malesuada odio scelerisque.",
  },
];
// saadafahmed45;
// Swg9Q3gK7WUTcMGu;
// mongodb setting here

const uri =
  "mongodb+srv://saadafahmed45:Swg9Q3gK7WUTcMGu@cluster0.58zpnyp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
    // const database = client.db("productsDb");
    // const productCollection = database.collection("products");
    // Define a route to handle POST requests to add products
    app.post("/products", async (req, res) => {
      try {
        // Extract products array from request body
        const products = req.body;

        // Insert the array of products into the MongoDB collection
        const result = await client
          .db("productsDb")
          .collection("products")
          .insertMany(products);

        // Respond with the newly created products
        res.status(201).json(result.ops);
      } catch (error) {
        console.error("Error adding products:", error);
        res.status(500).json({ error: "Failed to add products" });
      }
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
  res.send("Hello World!");
});

app.get("/products", (req, res) => {
  res.send(products);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
