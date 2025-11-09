const express = require('express');
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000;

// middle wear

app.use(cors());
app.use(express.json());




app.get('/', (req, res) => {
  res.send('hello i am social events')
})

app.listen(port, () => {
  console.log('i am social port ' ,port)
})