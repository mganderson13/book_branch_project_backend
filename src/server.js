import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';

const app = express();
app.use(express.json());


const uri = process.env.MONGODB_URI
console.log("MongoDB URI:", process.env.MONGODB_URI);
const client = new MongoClient(uri);

  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);

//update user info with book
app.patch('/api/details/:id/:username', async (req, res) => {
    const { username } = req.params;
    const { bookID, review, rating } = req.body;

  if (!bookID || !review || !rating) {
    return res.status(400).json({ error: 'Missing book information' });
  }

  try {
    await client.connect();
    const db = client.db("book_branch_db");
    const collection = db.collection("user_info");

    const result = await collection.updateOne(
      { username: username },
      {
        $push: {
          books: {
            bookID: bookID,
            review: review,
            rating: rating,
          },
        },
      }
    );
    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Book added successfully' });
    } else {
      res.status(404).json({ error: 'User not found or no update made' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
    }
});

app.post('api/details/:id/review', (req, res) => {
    const { id } = req.params;
    const { postedBy, review } = req.body;

    const book = bookInfo.find(b => b.id === id);
    if (book) {
        
    }
});

app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});