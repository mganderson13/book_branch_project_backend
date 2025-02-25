import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { MongoClient } from 'mongodb';
import bcrypt from "bcrypt"; 
import fs from 'fs';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentialsPath = path.join(__dirname, '../credentials.json');
const credentials = JSON.parse(
  fs.readFileSync(credentialsPath, 'utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

const app = express();
app.use(express.json());


const uri = process.env.MONGODB_URI
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

// Middleware to verify Firebase token
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken; // Attach user data to request
      next();
  } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

//insert user to database
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing user information' });
  }

  try {
    await client.connect();
    const db = client.db("book_branch_db");
    const collection = db.collection("user_info");

    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await collection.insertOne({
      username: email, 
      password: hashedPassword,
    })
    if (result.insertedId) {
      res.status(201).json({ message: 'User added successfully' });
    } else {
      res.status(400).json({ error: 'Failed to add user' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
    }
})

//update user info with book
app.patch('/api/details/:id', async (req, res) => {
    const { id } = req.params;
    const { email, review, rating } = req.body;

  if (!email || !review || !rating) {
    return res.status(400).json({ error: 'Missing book information' });
  }

  try {
    await client.connect();
    const db = client.db("book_branch_db");
    const collection = db.collection("user_info");

    const result = await collection.updateOne(
      { username: email }, 
      {
        $push: {
          books: {
            bookID: id,
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

// GET user books for profile
app.get('/api/profile', authenticateUser, async (req, res) => {
  try{
    await client.connect();
    const db = client.db("book_branch_db");
    const collection = db.collection("user_info");

    const userEmail = req.user.email;

    const user = await collection.findOne({ username: userEmail });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user.books || []); // Return user's books
} catch (err) {
    console.error("Error fetching user books:", err);
    res.status(500).json({ error: "Internal server error" });
} finally {
    await client.close();
  }
})


app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});