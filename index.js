const express = require('express');
const cors = require('cors')
const admin = require('firebase-admin');
const serviceAccount = require('./social.json');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 3000;


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


// middle wear

app.use(cors());
app.use(express.json());


const verifyToken =async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
   return  res.status(401).send({message:'unauthorized access'})
  }

  const token = authorization.split(' ')[1];

  try {
    const decoded =await admin.auth().verifyIdToken(token);
    
    req.token_email = decoded.email;
    
     next();
  } catch  {
     return res.status(401).send({ message: 'unauthorized access' });
  }
 
}

const uri = `mongodb+srv://${process.env.S3_Name}:${process.env.S3_Key}@cluster0.jkj46mi.mongodb.net/?appName=Cluster0`;

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
   
    // await client.connect();
    const socialEventsDB = client.db('socialEvents');
    const createEvents = socialEventsDB.collection('events')
    const joinEvents = socialEventsDB.collection('join');
    const usersData = socialEventsDB.collection('users')



    // set users in register

    app.post('/user-data', async (req, res) => {
     const usersBody = req.body
       const email = usersBody.email;
      const query = { email: email };
      const user = await usersData.findOne(query);

      if (user) {
        return res.send({message: 'Already register'})
      } else {
        const result = await usersData.insertOne(usersBody);
        res.send(result);
      }

      
    })
  
    // upcoming events 
    app.get('/events-upcoming', async (req, res) => {
      const today = new Date();

      const search = req.query.search;
      const filter = req.query.category;
       const { limit, skip } = req.query;
     
      const query = { event_date: { $gt: today } };

      if (search) {
        query.title = { $regex: search, $options: 'i' };

      };
      if (filter) {
        query.event_category = filter;
      }

      const cursor = createEvents.find(query).sort({ event_date: 1 }).limit(Number(limit)).skip(Number(skip));
      const  count = await createEvents.countDocuments(query)
      const result = await cursor.toArray()
      res.send({result,count})
    });

    // manage own events 
    app.get('/manage-event', verifyToken, async (req, res) => {
      const email = req.query.email
      const { limit, skip } = req.query;
      const query = {}
      if (email) {
        if (!email === req.token_email) {
          return res.status(403).send({ message: 'not access' });
        }
        query.email = email;
      }
     
      const cursor = createEvents.find(query).sort({ event_date: 1 }).limit(Number(limit)).skip(Number(skip));
      const count = await createEvents.countDocuments(query);
      const result = await cursor.toArray();
      res.send({result,count})
    })
    app.get('/details/:id', async (req, res) => {
      const id =req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await createEvents.findOne(query);
      res.send(result)
    });

   
    

    app.post('/events',verifyToken,async (req, res) => {
      const newEvents = req.body;
      const event_date = new Date(req.body.event_date)
      const result = await createEvents.insertOne({ ...newEvents,event_date });
      res.send(result)
    })


    app.put('/update-event/:id',verifyToken, async (req, res) => {
      const id = req.params.id;
      const event_date =new Date(req.body.event_date)
      const query = { _id: new ObjectId(id) };
      const updateData = req.body

      const update = {
        $set: { ...updateData ,event_date},
      };

      const result = await createEvents.updateOne(query, update);
      res.send(result)

    })

    app.delete('/delete/:id',verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id) };
      const result = await createEvents.deleteOne(query);
      res.send(result)
    })

    app.get('/join-page',verifyToken, async(req, res) => {
      const email = req.query.email;
      const { limit, skip, sort = 'event_date', order  } = req.query;
      const sortApps = {};
      if (order) {
        sortApps[sort || 'event_date'] = order === 'asc' ? 1 : -1;
      }
      const query = {}
      if (email) {
        if (!email === req.token_email) {
          return res.status(403).send({ message: 'not access' })
        }
        query.email = email;
      }
      const cursor = joinEvents.find(query).sort(sortApps).limit(Number(limit)).skip(Number(skip));
      const count = await joinEvents.countDocuments(query)
      const result = await cursor.toArray()
      res.send({ result ,count});
    })

    app.post('/join',verifyToken, async(req, res) => {
      const join = req.body;
      const event_date = new Date(req.body.event_date);
      const result = await joinEvents.insertOne({ ...join, event_date });
      res.send(result);
       
      
  })

    app.delete('/delete-join/:id',verifyToken, async(req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await joinEvents.deleteOne(query);
      res.send(result)

    })

    // total count overview

    app.get('/over-view', async (req, res) => {
      const totalUsers = await usersData.countDocuments();
      const totalEvents = await createEvents.countDocuments();
      const totalJoined = await joinEvents.countDocuments();
      res.send([{ totalEvents, totalJoined, totalUsers }]);
    })

    
    // await client.db('admin').command({ ping: 1 });
    // console.log(
    //   'Pinged your deployment. You successfully connected to MongoDB!'
    // );
  } finally {
   
    
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log('i am social port ' ,port)
})