// PROTECTED NOTES APP - Step 1
// Backend with MySQL, Signup, Login, Sessions

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========
app.use(express.json());  // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));  // Parse form data
app.use(express.static('views'));  // Serve HTML files from views folder

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,  // Don't save session if unmodified
    saveUninitialized: false,  // Don't create session until something stored
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,  // 24 hours
        httpOnly: true  // Prevents client-side JS from accessing cookie
    }
}));

// ========== DATABASE CONNECTION ==========
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// Test database connection
async function testDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        process.exit(1);
    }
}
testDatabase();

// ========== HELPER FUNCTIONS ==========

// Middleware: Check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();  // User is logged in, continue to route
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
}

// ========== AUTH ROUTES ==========

// Signup - Create new user
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    
    try {
        // Check if user already exists
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Insert new user
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        
        // Create session for the new user
        req.session.userId = result.insertId;
        req.session.username = username;
        
        res.status(201).json({ 
            success: true, 
            message: 'Account created successfully',
            user: { id: result.insertId, username, email }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// Login - Authenticate existing user
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        // Find user by email
        const [users] = await pool.execute(
            'SELECT id, username, email, password_hash FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const user = users[0];
        
        // Compare password with hash
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Create session
        req.session.userId = user.id;
        req.session.username = user.username;
        
        res.json({ 
            success: true, 
            message: 'Logged in successfully',
            user: { id: user.id, username: user.username, email: user.email }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Logout - Destroy session
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Get current user (check if logged in)
app.get('/api/me', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ authenticated: false });
    }
    
    try {
        const [users] = await pool.execute(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [req.session.userId]
        );
        
        if (users.length === 0) {
            req.session.destroy();
            return res.json({ authenticated: false });
        }
        
        res.json({ 
            authenticated: true, 
            user: users[0] 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Protected route example (notes will go here in Step 2)
app.get('/api/protected', isAuthenticated, (req, res) => {
    res.json({ message: 'You are authenticated!', userId: req.session.userId });
});

// ========== NOTES ROUTES ==========

// Get all notes for logged-in user
app.get('/api/notes', isAuthenticated, async (req, res) => {
    try {
        const [notes] = await pool.execute(
            'SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
            [req.session.userId]
        );
        res.json({ success: true, notes });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Create a new note
app.post('/api/notes', isAuthenticated, async (req, res) => {
    const { title, content } = req.body;
    
    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
    }
    
    try {
        const [result] = await pool.execute(
            'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
            [req.session.userId, title.trim(), content || '']
        );
        
        const [newNote] = await pool.execute(
            'SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ success: true, note: newNote[0] });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Update an existing note
app.put('/api/notes/:id', isAuthenticated, async (req, res) => {
    const noteId = req.params.id;
    const { title, content } = req.body;
    
    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
    }
    
    try {
        // Verify note belongs to this user
        const [notes] = await pool.execute(
            'SELECT id FROM notes WHERE id = ? AND user_id = ?',
            [noteId, req.session.userId]
        );
        
        if (notes.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        await pool.execute(
            'UPDATE notes SET title = ?, content = ? WHERE id = ?',
            [title.trim(), content || '', noteId]
        );
        
        const [updatedNote] = await pool.execute(
            'SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?',
            [noteId]
        );
        
        res.json({ success: true, note: updatedNote[0] });
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Delete a note
app.delete('/api/notes/:id', isAuthenticated, async (req, res) => {
    const noteId = req.params.id;
    
    try {
        const [result] = await pool.execute(
            'DELETE FROM notes WHERE id = ? AND user_id = ?',
            [noteId, req.session.userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        res.json({ success: true, message: 'Note deleted' });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// ========== SERVE HTML PAGES ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});