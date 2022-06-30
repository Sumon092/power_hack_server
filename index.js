const express = require('express')
const app = express()
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}
app.use(cors(corsConfig))
app.options("*", cors(corsConfig))
app.use(express.json())
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authorization")
    next()
});

const uri = `mongodb+srv://power_user:SmPGiks1AvIXCmgU@cluster0.h528v.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {
    try {
        await client.connect();
        console.log("db connected");
        const billingCollection = client.db('power_db').collection('billings');
        const userCollection = client.db('power_db').collection('users');
        console.log('sfdsfdsfds');

        app.get('/billingList', async (req, res) => {
            const billings = await billingCollection.find().toArray();
            res.send(billings)
        });

        app.post('/login', verifyJWT, async (req, res) => {
            let requestUser = req.body;
            const data = await userCollection.find({ email: { $eq: requestUser.email } }).toArray();
            if (data[0]?.email === requestUser.email && requestUser.pass === data[0]?.pass) {
                const isStatus = {
                    email: data[0]?.email, status: 200, success: true
                }
                res.send(isStatus)
            }
            else {
                const isStatus = {
                    email: data[0]?.email, status: 404, success: false
                }
                res.send(isStatus)
            }

            console.log(data, " from database")
        });



        app.put('/registration', async (req, res) => {
            const name = req.params.name;
            const email = req.params.email;
            const pass = req.params.pass;
            const user = req.body;
            const filter = { email: email, name: name, pass: pass }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            };
            const results = await userCollection.updateOne(filter, updateDoc, options);
            res.send(results);

            // delete Billings 
            app.delete('/billing', async (req, res) => {

                console.log('route is ok');
                res.send('data hasbeen delete')
            })

            // app.

            app.delete('/deleteBilling/:id', async (req, res) => {
                const id = req.params.id;

                console.log(req.params, "data _Id")
                console.log('id', id);
                const query = { _id: ObjectId(id) };
                const result = await billingCollection.deleteOne(query);
                res.send(result);
            });
        })
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('power pack is running')
})

app.listen(port, () => {
    console.log(`power hack app listening on port ${port}`)
})