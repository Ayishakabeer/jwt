require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log(err));

// User model schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  phoneNumber: String,
});

const User = mongoose.model('User', userSchema);

// Middleware to parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register route
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, phoneNumber } = req.body;
  
    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);
  
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword, 
      phoneNumber,
    });
  
    try {
      await newUser.save();
      res.json({ message: 'User registered successfully!' });
    } catch (err) {
      res.status(500).json({ message: 'Error registering user', error: err });
    }
  });


// Login route to authenticate users
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
  
      // Compare the entered password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password' });
      }
  
      // Send a success response and JWT token
      const token = jwt.sign({ userId: user._id }, 'your-jwt-secret', { expiresIn: '1h' });
      res.json({ message: 'Login successful', token });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  });
  



// GET route to display all users in an HTML table
app.get('/users', async (req, res) => {
    try {
      const users = await User.find();
      let userTable = `
        <html>
          <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');

                body {
                    font-family: 'Poppins', sans-serif;
                    background-color: #f0f4f8;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }

                table {
                    width: 90%;
                    // max-width: 800px;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin-top: 30px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    background-color: white;
                    border-radius: 12px;
                    overflow: hidden;
                }

                th, td {
                    padding: 18px;
                    text-align: left;
                    font-size: 16px;
                }

                th {
                    background: linear-gradient(45deg, #1e88e5, #42a5f5);
                    color: white;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-size: 18px;
                }

                td {
                    color: #555;
                    font-weight: 400;
                }

                tr:hover td {
                    background-color: #e3f2fd;
                    transition: background-color 0.3s ease;
                }

                table tr:last-child td {
                    border-bottom: none;
                }

                table tr:first-child th:first-child {
                    border-top-left-radius: 12px;
                }

                table tr:first-child th:last-child {
                    border-top-right-radius: 12px;
                }

                table tr:last-child td:first-child {
                    border-bottom-left-radius: 12px;
                }

                table tr:last-child td:last-child {
                    border-bottom-right-radius: 12px;
                }
                </style>


          </head>
          <body>
            <table>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Phone Number</th>
              </tr>
      `;
  
      users.forEach((user) => {
        userTable += `
          <tr>
            <td>${user.firstName}</td>
            <td>${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.phoneNumber}</td>
          </tr>
        `;
      });
  
      userTable += `
            </table>
          </body>
        </html>
      `;
  
      res.send(userTable); 
    } catch (err) {
      res.status(500).send('Error fetching users');
    }
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});