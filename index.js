const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gt8d3ye.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		// await client.connect();

		const classCollection = client
			.db('summerCamp')
			.collection('classCollection');

		// const instructorCollection = client
		// 	.db('summerCamp')
		// 	.collection('instructorCollection');

		const usersCollection = client
			.db('summerCamp')
			.collection('usersCollection');

		// class api
		app.get('/allClass', async (req, res) => {
			const classes = await classCollection.find().toArray();
			res.send(classes);
		});

		app.get('/sortClass', async (req, res) => {
			const query = {};
			const options = {
				sort: { numberOfStudents: -1 },
			};
			const classes = await classCollection
				.find(query, options)
				.limit(6)
				.toArray();
			res.send(classes);
		});

		// users api
		app.post('/users', async (req, res) => {
			const user = req.body;
			const query = { email: user.email };
			const existingUser = await usersCollection.findOne(query);
			if (existingUser) {
				return res.send({ message: 'user already exists' });
			}
			const users = await usersCollection.insertOne(user);
			res.send(users);
		});

		app.get('/users/students', async (req, res) => {
			const query = { role: 'student' };
			const students = await usersCollection.find(query).toArray();
			res.send(students);
		});

		// instructor api
		app.get('/users/instructor', async (req, res) => {
			const query = { role: 'instructor' };
			const instructors = await usersCollection.find(query).toArray();
			res.send(instructors);
		});

		app.get('/users/sortInstructor', async (req, res) => {
			const query = { role: 'instructor' };
			const instructor = await usersCollection.find(query).limit(6).toArray();
			res.send(instructor);
		});

		// get name and number of class for each instructor
		app.get('/class/:name', async (req, res) => {
			const name = decodeURIComponent(req.params.name);
			const query = { instructor: name };
			console.log(query);
			const instructorClass = await classCollection.find(query).toArray();
			res.send(instructorClass);
		});

		app.get('/users/admin', async (req, res) => {
			const query = { role: 'admin' };
			const admin = await usersCollection.find(query).toArray();
			res.send(admin);
		});

		// Send a ping to confirm a successful connection
		// await client.db('admin').command({ ping: 1 });
		// console.log(
		// 	'Pinged your deployment. You successfully connected to MongoDB!'
		// );
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.get('/', (req, res) => {
	res.send('Summer camp is running');
});

app.listen(port, () => {
	console.log('Summer camp is running on port number', port);
});
