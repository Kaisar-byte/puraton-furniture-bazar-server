const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')


// middleware
app.use(cors({
  origin: ['https://puraton-furniture-bazar-719b4.web.app'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())



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

const logger = (req, res, next) => {
  console.log("comming from logger middlewares", req.method, req.url);
  next()
}

const verifyToken = (req, res, next) => {
  // const token = req?.cookies?.token;
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access " })
    }
    req.user = decoded;
    next()
  })

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const furnitureCollection = client
      .db("furnitureDB")
      .collection("furniture");

    const userCollection = client.db("furnitureDB").collection("user");
    const orderCollection = client.db("furnitureDB").collection("order");


    // jwt authorizational api
    app.post('/jwt', logger, async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none"
        })
        .send({ success: true })
    })


    app.post("/logout", logger, async (req, res) => {
      const user = req.body;
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })

    // add new product
    app.post("/addProduct", async (req, res) => {
      const newProduct = req.body;
      const result = await furnitureCollection.insertOne(newProduct);
      res.send(result);
    });

    // get all products
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

    // get all users
    app.get("/users", logger, verifyToken, async (req, res) => {
      const user = req.user;
      if (user.email !== req.user.email) {
        res.status(403).send({ message: "forbidden access" })
      }
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/users/:email", logger, verifyToken, async (req, res) => {
      const user = req.user
      if (user.email !== req.params.email) {
        return res.status(403).send({ message: "forbidden access" })
      }
      const loggedUserEmail = req.params.email;
      const query = { email: loggedUserEmail };
      const result = await userCollection.findOne(query);
      res.send(result);
    });


    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    })
    app.get("/orders", logger, verifyToken, async (req, res) => {
      const cursor = orderCollection.find()
      const result = await cursor.toArray();
      res.send(result);
    })


  } finally {

  }
}
run().catch(console.dir);
