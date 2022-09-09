import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

//creating mongo connection
const createConnection = async () => {
  const client = new MongoClient(MONGO_URL);
  await client.connect();

  console.log(`connection to mongo server established ❣`);

  return client;
};

const client = await createConnection();

app.get("/", (req, res) => {
  res.send("<h1>App is working!!</h1>");
});

//creating rooms
app.post("/create_room", async (req, res) => {
  const data = req.body;

  const result = await client
    .db("booking")
    .collection("create_room")
    .insertOne(data);

  result.acknowledged
    ? res.status(200).send({ msg: "rooms created sucessfully" })
    : res
        .status(400)
        .send({ msg: "something went wrong! please try again later" });
});

//booking a room
app.post("/book_room", async (req, res) => {
  const data = req.body;

  const dateCheck = await client
    .db("booking")
    .collection("book_room")
    .findOne({ booking_date: data["booking_date"] });

  if (dateCheck.booking_date) {
    res.send({
      msg: "The room is booked for this date.. please select another date",
    });
    return;
  }

  const result = await client
    .db("booking")
    .collection("book_room")
    .insertOne(data);

  const test = await client
    .db("booking")
    .collection("create_room")
    .updateOne(
      { id: "8c323954-d13a-4882-b457-60e1c61fc623" },
      { $inc: { rooms_available: -1 } }
    );

  result.acknowledged
    ? res.status(200).send({ msg: "room booked sucessfully!!" })
    : res
        .status(404)
        .send({ msg: "something went wrong! please try again later" });
});

//list of booked rooms details
app.get("/booked_rooms", async (req, res) => {
  const result = await client
    .db("booking")
    .collection("book_room")
    .find(req.query)
    .toArray();

  res.status(200).send(result);
});

//list of customers details
app.get("/customers_info", async (req, res) => {
  const result = await client
    .db("booking")
    .collection("book_room")
    .find(
      { booked_status: true },
      {
        projection: {
          _id: 0,
          booked_status: 0,
        },
      }
    )
    .toArray();

  res.status(200).send(result);
});

app.listen(PORT, () => console.log(`server is running at port ${PORT}`));
