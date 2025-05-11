// Import necessary modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // Import multer for file uploads
const path = require('path'); // Import path module
const fs = require('fs'); // Import file system module for file cleanup

// Create an Express application instance
const app = express();
const port = 3001; // Choose a port for your backend

// Define a secret key for JWT signing (replace with a strong, unique key in production)
const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key'; // Use environment variable in production

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust in production)
// Use extended: true to allow parsing of complex objects from form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Configure Multer for file uploads
// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the directory where files will be stored
    // Ensure this directory exists or create it
    const uploadPath = path.join(__dirname, 'uploads');
    // You might want to create subdirectories based on user ID or application ID later
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Define how files will be named
    // Use a unique name to avoid conflicts (e.g., timestamp + original name)
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Create the Multer instance
const upload = multer({ storage: storage });


// Initialize SQLite database
const db = new sqlite3.Database('./investment_platform.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' -- 'user' or 'admin'
    )`, (createTableErr) => {
      if (createTableErr) {
        console.error('Error creating users table:', createTableErr.message);
      } else {
        console.log('Users table checked/created.');
        // Optional: Insert a default admin user if needed (consider hashing the password)
        // bcrypt.hash('adminpassword123', 10, (hashErr, hashedPassword) => { // Hash a strong password
        //   if (!hashErr) {
        //     db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', hashedPassword, 'admin'], (insertErr) => {
        //       if (insertErr) {
        //         console.error('Error inserting default admin user:', insertErr.message);
        //       } else {
        //         console.log('Default admin user checked/inserted.');
        //       }
        //     });
        //   } else {
        //     console.error('Error hashing default admin password:', hashErr.message);
        //   }
        // });
      }
    });

    // Create onboarding_applications table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS onboarding_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT,
      govt_id_number TEXT,
      mobile TEXT,
      email TEXT,
      time_horizon INTEGER,
      risk_tolerance TEXT,
      investments_owned TEXT, -- Store as JSON string or comma-separated
      acceptable_annual_return TEXT,
      dob TEXT,
      nationality TEXT,
      address TEXT,
      client_type TEXT,
      govt_id_file_path TEXT, -- Store path to the uploaded file
      contact_details TEXT,
      source_of_funds TEXT,
      occupation_details TEXT,
      income_proof_file_path TEXT, -- Store path to the uploaded file
      selected_funds TEXT, -- Store as JSON string
      terms_accepted BOOLEAN,
      submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending', -- e.g., 'pending', 'approved', 'rejected'
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (createTableErr) => {
      if (createTableErr) {
        console.error('Error creating onboarding_applications table:', createTableErr.message);
      } else {
        console.log('Onboarding applications table checked/created.');
      }
    });

     // Create admin_tasks table if it doesn't exist (for workflow)
     db.run(`CREATE TABLE IF NOT EXISTS admin_tasks (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       application_id INTEGER NOT NULL,
       assigned_to_employee_id INTEGER NULL, -- NULL if not assigned
       status TEXT DEFAULT 'open', -- e.g., 'open', 'in_progress', 'completed'
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (application_id) REFERENCES onboarding_applications(id),
       FOREIGN KEY (assigned_to_employee_id) REFERENCES users(id) -- Assuming employees are also users
     )`, (createTableErr) => {
       if (createTableErr) {
         console.error('Error creating admin_tasks table:', createTableErr.message);
       } else {
         console.log('Admin tasks table checked/created.');
       }
     });

     // --- New Employees Table ---
     db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        position TEXT NOT NULL
     )`, (createTableErr) => {
        if (createTableErr) {
            console.error('Error creating employees table:', createTableErr.message);
        } else {
            console.log('Employees table checked/created.');
            // Insert fixed placeholder employees if they don't exist
            const insertEmployeesSql = `
                INSERT OR IGNORE INTO employees (id, name, position) VALUES
                (1, 'Alice Smith', 'Onboarding Specialist'),
                (2, 'Bob Johnson', 'Compliance Officer'),
                (3, 'Charlie Brown', 'Client Relations'),
                (4, 'Diana Prince', 'Senior Analyst'),
                (5, 'Ethan Hunt', 'Operations Manager');
            `;
             db.run(insertEmployeesSql, [], (insertErr) => {
                if (insertErr) {
                    console.error('Error inserting placeholder employees:', insertErr.message);
                } else {
                    console.log('Placeholder employees checked/inserted.');
                }
             });
        }
     });
     // --- End New Employees Table ---
  }
});

// Middleware to verify JWT (for protected routes)
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get token from "Bearer TOKEN" format

  if (token == null) {
    return res.sendStatus(401); // If no token, unauthorized
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.sendStatus(403); // If token is invalid, forbidden
    }
    req.user = user; // Attach user payload to request object
    next(); // Proceed to the next middleware/route handler
  });
};

// Middleware to check if the user has the 'admin' role
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User is admin, proceed
    } else {
        res.sendStatus(403); // User is not admin, forbidden
    }
};


// Basic route to check if the server is running
app.get('/', (req, res) => {
  res.send('Investment Platform Backend is running!');
});

// Endpoint for user signup
app.post('/api/signup', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Hash the password using bcrypt
  bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
    if (hashErr) {
      console.error('Error hashing password:', hashErr.message);
      return res.status(500).json({ error: 'Error processing password' });
    }

    // Insert the new user with the hashed password into the database
    const insertSql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.run(insertSql, [username, hashedPassword], function(err) {
      if (err) {
        // Check if the error is due to a duplicate username
        if (err.message.includes('UNIQUE constraint failed')) {
          res.status(409).json({ error: 'Username already exists' });
        } else {
          console.error('Error inserting user:', err.message);
          res.status(500).json({ error: 'Error registering user' });
        }
        return;
      }
      res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
    });
  });
});


// Endpoint for user login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const selectSql = 'SELECT * FROM users WHERE username = ?';
  db.get(selectSql, [username], (err, row) => {
    if (err) {
      console.error('Error retrieving user:', err.message);
      res.status(500).json({ error: 'Error during login' });
      return;
    }

    if (!row) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    bcrypt.compare(password, row.password, (compareErr, isMatch) => {
      if (compareErr) {
        console.error('Error comparing passwords:', compareErr.message);
        return res.status(500).json({ error: 'Error during login' });
      }

      if (isMatch) {
        // Passwords match - generate JWT
        const userPayload = { id: row.id, username: row.username, role: row.role };
        const accessToken = jwt.sign(userPayload, jwtSecret, { expiresIn: '1h' }); // Token expires in 1 hour

        res.json({ message: 'Login successful', accessToken: accessToken, user: userPayload });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    });
  });
});

// Protected endpoint for dashboard data (example)
app.get('/api/dashboard', authenticateJWT, (req, res) => {
  // If the middleware passes, req.user will contain the user payload from the JWT
  res.json({ message: 'Welcome to the dashboard!', user: req.user });
});

// Protected endpoint to get user's onboarding status
app.get('/api/user/onboarding-status/:userId', authenticateJWT, (req, res) => {
    const requestedUserId = parseInt(req.params.userId, 10);
    const authenticatedUserId = req.user.id; // User ID from JWT

    // Security check: Ensure the authenticated user is requesting their own status
    // or is an admin
    if (requestedUserId !== authenticatedUserId && req.user.role !== 'admin') {
        return res.sendStatus(403); // Forbidden if not authorized
    }

    // Query the database for the latest onboarding application for the user
    // ORDER BY submission_date DESC LIMIT 1 to get the most recent one
    const selectSql = `SELECT status FROM onboarding_applications WHERE user_id = ? ORDER BY submission_date DESC LIMIT 1`;
    db.get(selectSql, [requestedUserId], (err, row) => {
        if (err) {
            console.error('Error retrieving onboarding status:', err.message);
            return res.status(500).json({ error: 'Error fetching onboarding status.' });
        }

        if (row) {
            // Application found, return its status
            res.json({ status: row.status });
        } else {
            // No application found for this user
            res.json({ status: 'not_started' });
        }
    });
});


// Protected endpoint for client onboarding submission
// 'fields' handles non-file fields, 'files' handles file fields
app.post('/api/onboarding', authenticateJWT, upload.fields([
  { name: 'govtIdFile', maxCount: 1 },
  { name: 'incomeProofFile', maxCount: 1 }
]), (req, res) => {
  // Access form data from req.body
  const formData = req.body;
  // Access uploaded files from req.files
  const govtIdFile = req.files['govtIdFile'] ? req.files['govtIdFile'][0] : null;
  const incomeProofFile = req.files['incomeProofFile'] ? req.files['incomeProofFile'][0] : null;

  // Get user ID from the authenticated JWT payload
  const userId = req.user.id;

  // Basic validation (add more comprehensive validation as needed)
  if (!userId || !formData.fullName || !formData.govtIdNumber || !formData.mobile || !formData.email ||
      !formData.timeHorizon || !formData.riskTolerance || formData.acceptableAnnualReturn === '' ||
      !formData.dob || !formData.nationality || !formData.address || !formData.clientType || !govtIdFile ||
      !formData.sourceOfFunds || !formData.occupationDetails || !incomeProofFile || formData.termsAccepted !== 'true') { // Check for 'true' string
      console.error('Validation failed for onboarding submission. Missing data or files.');
      // Clean up uploaded files if validation fails
      if (govtIdFile && fs.existsSync(govtIdFile.path)) fs.unlink(govtIdFile.path, (err) => { if (err) console.error('Error deleting file:', err); });
      if (incomeProofFile && fs.existsSync(incomeProofFile.path)) fs.unlink(incomeProofFile.path, (err) => { if (err) console.error('Error deleting file:', err); });
      return res.status(400).json({ error: 'Missing required onboarding data or files.' });
  }

  // Convert array/object data to JSON strings for storage
  const investmentsOwnedJson = JSON.stringify(formData.investmentsOwned || []);
  const selectedFundsJson = JSON.stringify(formData.selectedFunds || []);
  // termsAccepted is already a string 'true' or 'false' from FormData


  // Insert onboarding data into the database
  const insertSql = `INSERT INTO onboarding_applications (
    user_id, full_name, govt_id_number, mobile, email,
    time_horizon, risk_tolerance, investments_owned, acceptable_annual_return,
    dob, nationality, address, client_type, govt_id_file_path, contact_details,
    source_of_funds, occupation_details, income_proof_file_path, selected_funds, terms_accepted, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    userId,
    formData.fullName,
    formData.govtIdNumber,
    formData.mobile,
    formData.email,
    formData.timeHorizon,
    formData.riskTolerance,
    investmentsOwnedJson,
    formData.acceptableAnnualReturn,
    formData.dob,
    formData.nationality,
    formData.address,
    formData.clientType,
    govtIdFile.path, // Store the path
    formData.contactDetails,
    formData.sourceOfFunds,
    formData.occupationDetails,
    incomeProofFile.path, // Store the path
    selectedFundsJson,
    formData.termsAccepted === 'true' ? 1 : 0, // Store boolean as 1 or 0 in SQLite
    'pending' // Default status is 'pending'
  ];

  db.run(insertSql, values, function(err) {
    if (err) {
      console.error('Error inserting onboarding application:', err.message);
       // Clean up uploaded files if database insertion fails
      if (govtIdFile && fs.existsSync(govtIdFile.path)) fs.unlink(govtIdFile.path, (err) => { if (err) console.error('Error deleting file:', err); });
      if (incomeProofFile && fs.existsSync(incomeProofFile.path)) fs.unlink(incomeProofFile.path, (err) => { if (err) console.error('Error deleting file:', err); });
      return res.status(500).json({ error: 'Error saving onboarding application.' });
    }
    console.log(`Onboarding application submitted for user ${userId}, ID: ${this.lastID}`);

    // --- Workflow Task Creation ---
    // After successful application submission, create a task for admin review
    const applicationId = this.lastID;
    const insertTaskSql = `INSERT INTO admin_tasks (application_id, status) VALUES (?, ?)`;
    db.run(insertTaskSql, [applicationId, 'open'], (taskErr) => {
        if (taskErr) {
            console.error('Error creating admin task for application', applicationId, ':', taskErr.message);
            // Decide how to handle task creation failure - might still return success for application submission
        } else {
            console.log(`Admin task created for application ${applicationId}`);
        }
    });
    // --- End Workflow Task Creation ---


    res.status(201).json({ message: 'Onboarding application submitted successfully', applicationId: this.lastID, status: 'pending' });
  });
});


// --- Admin Endpoints ---

// Protected endpoint to get a list of all pending onboarding applications for admin
app.get('/api/admin/onboarding/pending', authenticateJWT, isAdmin, (req, res) => {
    // Query the database to join onboarding applications with admin tasks
    // Filter for applications with status 'pending' and tasks with status 'open'
    // This ensures we only list applications that require admin review and haven't been assigned/closed yet
    const selectSql = `
        SELECT
            oa.id,
            oa.user_id,
            oa.full_name,
            oa.submission_date,
            oa.status as application_status, -- Alias to avoid conflict with task status
            at.id as task_id,
            at.status as task_status,
            at.assigned_to_employee_id
        FROM
            onboarding_applications oa
        JOIN
            admin_tasks at ON oa.id = at.application_id
        WHERE
            oa.status = 'pending' AND at.status = 'open'
        ORDER BY
            oa.submission_date ASC -- Order by submission date, oldest first
    `;

    db.all(selectSql, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving pending applications:', err.message);
            return res.status(500).json({ error: 'Error fetching pending applications.' });
        }

        // Return the list of pending applications
        res.json(rows);
    });
});

// Protected endpoint to get details of a specific onboarding application for admin
app.get('/api/admin/onboarding/application/:applicationId', authenticateJWT, isAdmin, (req, res) => {
    const applicationId = parseInt(req.params.applicationId, 10);

    if (isNaN(applicationId)) {
        return res.status(400).json({ error: 'Invalid application ID provided.' });
    }

    // Query the database to get the full details of the specific application
    // You might also want to join with the users table to get applicant's username etc.
    const selectSql = `
        SELECT
            oa.*, -- Select all columns from onboarding_applications
            at.assigned_to_employee_id -- Also get the assigned employee ID from the task
        FROM
            onboarding_applications oa
        LEFT JOIN -- Use LEFT JOIN in case a task hasn't been created yet (though our POST should create one)
            admin_tasks at ON oa.id = at.application_id
        WHERE
            oa.id = ?
    `;

    db.get(selectSql, [applicationId], (err, row) => {
        if (err) {
            console.error('Error retrieving application details:', err.message);
            return res.status(500).json({ error: `Error fetching application details for ID ${applicationId}.` });
        }

        if (!row) {
            // No application found with that ID
            return res.status(404).json({ error: `Application with ID ${applicationId} not found.` });
        }

        // Return the application details
        res.json(row);
    });
});

// Protected endpoint to get a list of employees for admin
// Now queries the new 'employees' table
app.get('/api/admin/employees', authenticateJWT, isAdmin, (req, res) => {
    // Query the new 'employees' table to find all employees
    const selectSql = `SELECT id, name, position FROM employees ORDER BY name ASC`;

    db.all(selectSql, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving employees:', err.message);
            return res.status(500).json({ error: 'Error fetching employees.' });
        }

        // Return the list of employees
        res.json(rows);
    });
});

// Protected endpoint to assign an employee to an onboarding application task
app.post('/api/admin/onboarding/application/:applicationId/assign', authenticateJWT, isAdmin, (req, res) => {
    const applicationId = parseInt(req.params.applicationId, 10);
    const assignedToEmployeeId = parseInt(req.body.assignedToEmployeeId, 10);

    // Validate input
    if (isNaN(applicationId) || isNaN(assignedToEmployeeId)) {
        return res.status(400).json({ error: 'Invalid application ID or employee ID provided.' });
    }

    // Check if the employee ID exists in the employees table (optional but recommended)
    db.get(`SELECT id FROM employees WHERE id = ?`, [assignedToEmployeeId], (err, employeeRow) => {
        if (err) {
            console.error('Error checking employee existence:', err.message);
            return res.status(500).json({ error: 'Error validating employee.' });
        }
        if (!employeeRow) {
            return res.status(404).json({ error: `Employee with ID ${assignedToEmployeeId} not found.` });
        }

        // Update the admin_tasks table for the given application ID
        // We assume there's always one task per application created on submission
        const updateSql = `
            UPDATE admin_tasks
            SET
                assigned_to_employee_id = ?,
                status = 'in_progress', -- Optionally update task status to 'in_progress'
                updated_at = CURRENT_TIMESTAMP
            WHERE
                application_id = ?
        `;

        db.run(updateSql, [assignedToEmployeeId, applicationId], function(err) {
            if (err) {
                console.error('Error assigning employee to task:', err.message);
                return res.status(500).json({ error: 'Error assigning employee.' });
            }

            // Check if any row was actually updated
            if (this.changes === 0) {
                // This might happen if the application ID doesn't exist or no task was created
                 console.warn(`No admin task found for application ID ${applicationId} to assign employee.`);
                 // You might decide to return 404 or a specific message here
                 return res.status(404).json({ error: `Admin task for application ID ${applicationId} not found.` });
            }

            console.log(`Employee ${assignedToEmployeeId} assigned to application task ${applicationId}.`);
            res.json({ message: 'Employee assigned successfully', applicationId: applicationId, assignedToEmployeeId: assignedToEmployeeId });
        });
    });
});

// New Protected endpoint to update the status of an onboarding application
app.post('/api/admin/onboarding/application/:applicationId/status', authenticateJWT, isAdmin, (req, res) => {
    const applicationId = parseInt(req.params.applicationId, 10);
    const newStatus = req.body.status; // Expected status: 'pending', 'approved', 'rejected'

    // Validate input
    if (isNaN(applicationId) || !newStatus) {
        return res.status(400).json({ error: 'Invalid application ID or status provided.' });
    }

    // Validate the new status value
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ error: `Invalid status value: ${newStatus}. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Update the status in the onboarding_applications table
    const updateAppSql = `
        UPDATE onboarding_applications
        SET
            status = ?
        WHERE
            id = ?
    `;

    db.run(updateAppSql, [newStatus, applicationId], function(err) {
        if (err) {
            console.error('Error updating application status:', err.message);
            return res.status(500).json({ error: 'Error updating application status.' });
        }

        // Check if any row was actually updated in onboarding_applications
        if (this.changes === 0) {
             console.warn(`No onboarding application found with ID ${applicationId} to update status.`);
             return res.status(404).json({ error: `Onboarding application with ID ${applicationId} not found.` });
        }

        console.log(`Application ${applicationId} status updated to ${newStatus}.`);

        // --- Optional: Update Admin Task Status ---
        // If the status is approved or rejected, you might want to mark the admin task as completed
        let taskStatus = 'in_progress'; // Default task status
        if (newStatus === 'approved' || newStatus === 'rejected') {
            taskStatus = 'completed'; // Mark task as completed if application is finalized
        }

        const updateTaskSql = `
            UPDATE admin_tasks
            SET
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE
                application_id = ?
        `;

        db.run(updateTaskSql, [taskStatus, applicationId], (taskErr) => {
            if (taskErr) {
                console.error('Error updating related admin task status for application', applicationId, ':', taskErr.message);
                // This is a secondary update, so we might still return success for the application status update
            } else {
                 if (this.changes > 0) {
                    console.log(`Related admin task for application ${applicationId} status updated to ${taskStatus}.`);
                 } else {
                     console.warn(`No related admin task found for application ID ${applicationId} to update task status.`);
                 }
            }
        });
        // --- End Optional Task Status Update ---


        res.json({ message: 'Application status updated successfully', applicationId: applicationId, newStatus: newStatus });
    });
});


// Start the server
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  // Create the uploads directory if it doesn't exist
  const uploadPath = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadPath)){
      fs.mkdirSync(uploadPath);
      console.log(`Created uploads directory at ${uploadPath}`);
  }
});

// Close the database connection when the app exits
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
