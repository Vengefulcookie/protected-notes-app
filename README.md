# Protected Notes App

> A full-stack notes app with user authentication. Sign up, log in, and create private notes — each user has their own encrypted vault. Watch the demo video to see it in action.

[![Watch Demo](https://img.shields.io/badge/Watch-Demo-red)](https://youtu.be/aOMVieUtltg)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-blue)](https://github.com/Vengefulcookie/protected-notes-app)

## What This Project Does
Most notes apps store your data in plain text. This one doesn't. When you sign up, your password is hashed using bcrypt before it ever touches the database. When you log in, your session is managed securely. And your notes? Only you can see them — the app checks authentication before returning any data.

**What it does:**
- User registration with password hashing
- Secure login with session management
- Create, read, update, and delete private notes
- Each user's notes are completely separate from others'
- Demo video available showing the full flow

## How I Built This
- **Node.js & Express** - Backend server and API routes
- **MySQL** - Database for users and notes
- **bcrypt** - For password hashing (never store plain-text passwords!)
- **Session Authentication** - To keep users logged in
- **HTML/CSS/JavaScript** - Frontend interface

## Watch the Demo
[Click here to watch the full demo on YouTube](https://youtu.be/aOMVieUtltg)

The video shows:
- Creating a new account
- Logging in with the new credentials
- Creating private notes
- Logging out and verifying notes are still there

## What I Learned
Full-stack development is a different beast than frontend-only work. I learned about REST API design, database schemas, and why you never roll your own crypto (bcrypt does the heavy lifting). Session management taught me about cookies, tokens, and stateless authentication. The most important lesson? Security isn't a feature you add at the end — it has to be built in from the start.

## Running Locally
```bash
# Clone the repository
git clone https://github.com/Vengefulcookie/protected-notes-app.git
cd protected-notes-app

# Install backend dependencies
npm install

# Set up your MySQL database
# Create a database named 'notes_app'
# Run the schema.sql file to create tables

# Create a .env file with your database credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=notes_app
# SESSION_SECRET=your_secret_key

# Start the server
npm start
```

Note: The app will run at http://localhost:3000

## Contact
- GitHub: github.com/Vengefulcookie
- LinkedIn: linkedin.com/in/snethemba-shangase-softw-mech-civil0101

Built with ☕, bcrypt, and a healthy respect for user privacy

text
