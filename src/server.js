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


app.put('/api/details/:id/like', (req, res) => {
    const { id } = req.params;
    const book = bookInfo.find(b => b.id === id);
    if (book) {
    book.like = true;
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