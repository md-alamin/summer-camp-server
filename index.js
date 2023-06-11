const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
	const authorization = req.headers.authorization;
	if (!authorization) {
		return res
			.status(401)
			.send({ error: true, message: 'Unauthorized Access' });
	}

	const token = authorization.split(' ')[1];

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
		if (err) {
			return res
				.status(401)
				.send({ error: true, message: 'Unauthorized Access' });
		}
		req.decoded = decoded;
		next();
	});
};

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

		const usersCollection = client
			.db('summerCamp')
			.collection('usersCollection');

		const cartCollection = client.db('summerCamp').collection('cartCollection');

		// verify jwt
		app.post('/jwt', (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: '1h',
			});
			res.send({ token });
		});

		const verifyStudent = async (req, res, next) => {
			const email = req.decoded.email;
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			if (user?.role !== 'student') {
				return res
					.status(403)
					.send({ error: true, message: 'Forbidden Message' });
			}
			next();
		};

		const verifyInstructor = async (req, res, next) => {
			const email = req.decoded.email;
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			if (user?.role !== 'student') {
				return res
					.status(403)
					.send({ error: true, message: 'Forbidden Message' });
			}
			next();
		};

		const verifyAdmin = async (req, res, next) => {
			const email = req.decoded.email;
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			if (user?.role !== 'student') {
				return res
					.status(403)
					.send({ error: true, message: 'Forbidden Message' });
			}
			next();
		};

		// class api
		app.get('/allClass/:sort', async (req, res) => {
			const classSort = req.params.sort;
			const query = {};
			const options = {
				sort: { numberOfStudents: -1 },
			};
			if (classSort === 'sort') {
				const classes = await classCollection
					.find(query, options)
					.limit(6)
					.toArray();
				res.send(classes);
			} else {
				const classes = await classCollection.find().toArray();
				res.send(classes);
			}
		});

		// users api
		app.get('/users', verifyJWT, async (req, res) => {
			const users = await usersCollection.find().toArray();
			res.send(users);
		});

		app.get('/users/students', async (req, res) => {
			const query = { role: 'student' };
			const students = await usersCollection.find(query).toArray();
			res.send(students);
		});

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

		// cart api
		app.get('/cart/:email', verifyJWT, async (req, res) => {
			const email = req.params.email;
			if (!email) {
				res.send();
			}
			const decodedEmail = req.decoded.email;
			if (email !== decodedEmail) {
				return res
					.status(403)
					.send({ error: true, message: 'Forbidden Message' });
			}
			const query = { email: email };
			const result = await cartCollection.find(query).toArray();
			res.send(result);
		});

		app.post('/cart', verifyJWT, async (req, res) => {
			const item = req.body;
			const { classId, email } = item;
			const query = { classId, email };

			const existingCartItem = await cartCollection.findOne(query);
			if (existingCartItem) {
				return res.send({ error: true, message: 'class already exists' });
			}
			const result = await cartCollection.insertOne(item);
			res.send(result);
		});

		app.delete('/cart/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await cartCollection.deleteOne(query);
			res.send(result);
		});

		// instructor api
		app.get('/users/instructor', async (req, res) => {
			const query = { role: 'Instructor' };
			const instructors = await usersCollection.find(query).toArray();
			res.send(instructors);
		});

		app.get('/users/sortInstructor', async (req, res) => {
			const query = { role: 'Instructor' };
			const instructor = await usersCollection.find(query).limit(6).toArray();
			res.send(instructor);
		});

		// get name and number of class for each instructor
		app.get('/class/:name', async (req, res) => {
			const name = decodeURIComponent(req.params.name);
			const query = { instructor: name };
			const instructorClass = await classCollection.find(query).toArray();
			res.send(instructorClass);
		});
		// admin apis
		app.get('/users/admin', async (req, res) => {
			const query = { role: 'Admin' };
			const admin = await usersCollection.find(query).toArray();
			res.send(admin);
		});

		app.patch('/users/make-admin/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const updateDoc = {
				$set: {
					role: 'Admin',
				},
			};
			const result = await usersCollection.updateOne(query, updateDoc);
			res.send(result);
		});

		app.patch('/users/make-instructor/:id', async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const updateDoc = {
				$set: {
					role: 'Instructor',
				},
			};
			const result = await usersCollection.updateOne(query, updateDoc);
			res.send(result);
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
