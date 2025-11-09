const express = require('express');
const cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express()
const port = process.env.PORT || 3000;

// middle wear

app.use(cors());
app.use(express.json());

// social-events
// clMQwUIrbnfo1bNK

const uri = `mongodb+srv://${process.env.Mongodb_Name}:${process.env.Mongodb_Key}@cluster0.jkj46mi.mongodb.net/?appName=Cluster0`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });


app.get('/', (req, res) => {
  res.send('hello i am social events')
})



async function run() {
  try {
   
    await client.connect();
    
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
   
    await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log('i am social port ' ,port)
})