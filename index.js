import express from "express";
import "dotenv/config";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("IncubatorA8");
const productsCollection = db.collection("products");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }

  const token = authHeader.split(" ")[1];
  console.log(token);
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);

    next();
  } catch (error) {
    return res.status(500).send({ msg: "Server Error!" });
  }
};

app.post("/products", async (req, res) => {
  const data = req.body;

  const result = await productsCollection.insertOne(data);

  res.send(result);
});

app.get("/products", verifyToken, async (req, res) => {
  const products = await productsCollection.find().toArray();

  res.send(products);
});

app.get("/products/:id", async (req, res) => {
  const id = req.params.id;

  const product = await productsCollection.findOne({ _id: new ObjectId(id) });

  res.send(product);
});

app.delete("/products/:id", async (req, res) => {
  const id = req.params.id;

  const result = await productsCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});

app.patch("/products/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  const result = await productsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: data },
  );

  res.send(result);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
