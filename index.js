const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");


// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Puraton Furniture Bazar server is running ");
});

app.listen(port, () => {
  console.log(`Puraton Furniture Bazar server is running on port ${port}`);
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i2wvmgk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    console.log("working fine");

    const furnitureCollection = client
      .db("furnitureDB")
      .collection("furniture");

    const userCollection = client.db("furnitureDB").collection("user");

    // add new product
    app.post("/addProduct", async (req, res) => {
      const newProduct = req.body;
      const result = await furnitureCollection.insertOne(newProduct);
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      const cursor = furnitureCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/categories/:subCategory", async (req, res) => {
      const subCategory = req.params.subCategory;
      const query = { productCategory: { $eq: subCategory } };
      const categorywiseData = await furnitureCollection.find(query).toArray();
      res.send(categorywiseData);
    });

    app.post("/user", async (req, res) => {
      const newUser = req.body;
      const email = newUser.email;
      const query = { email: email };
      const existUser = await userCollection.findOne(query);
      if (existUser) {
        res.status(406).send({ error: true, message: "User Already exist" });
      } else {
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    });

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.get("/dashboard", (req, res) => {
      const email = req.params.body;
      console.log(email);
    });
  } finally {
  }
}
run().catch(console.dir);
