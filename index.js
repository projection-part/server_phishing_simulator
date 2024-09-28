const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
require('./db');

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Employee = require('./models/employee');
dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: process.env.frontend_url,
    methods: 'GET,POST,PUT,DELETE,PATCH',
    credentials: true,
}));
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.error('MongoDB connection error:', err));
// Nodemailer code
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
// verification email confog
transporter.verify((error) => {
    if (error) {
        console.error('Error with email setup:', error);
    } else {
        console.log('Email service ready');
    }
});
// notification to test test server is running or not
app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.get('/admin-dashboard/employee-count', async (req, res) => {
    try {
        const totalEmployees = await Employee.countDocuments({});
        res.json({ totalEmployees });
    } catch (error) {
        res.status(500).json({ error: 'Error while fetching employee count' });
    }
});

app.get('/admin-dashboard/total-clicked', async (req, res) => {
    try {
        const clickedCount = await Employee.countDocuments({ clicked: true });
        res.json({ clickedCount });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching employee clicked count' });
    }
});

app.get('/admin-dashboard/clicked-percentage', async (req, res) => {
    try {
        const totalEmployees = await Employee.countDocuments({});
        const clickedCount = await Employee.countDocuments({ clicked: true });
        const clickedPercentage = (clickedCount / totalEmployees) * 100;
        res.json({ totalEmployees, clickedCount, clickedPercentage });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching employee clicked percentage' });
    }
});

// Adding new employee
app.post('/add-employee', async (req, res) => {
    try {
        const { name, email } = req.body;
        const newEmployee = new Employee({ name, email });
        await newEmployee.save();
        res.status(201).json(newEmployee);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add employee' });
    }
});

// Finding alll employees
app.get('/employees', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Send phishing email to employees
app.post('/send-phishing-email/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    try {
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        // Phishing link with employee's ID
        const phishingLink = `${process.env.frontend_url}/phishing-simulation?employeeId=${employeeId}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: employee.email,
            subject: 'Urgent: Action Required to Confirm Your Company Benefits',
            html: `
                <h3  style="font-family: Arial, sans-serif; line-height: 1.5;">
                    Dear ${employee.name},
                </h3>

                    <p>We have noticed that your company account requires verification to maintain access to our internal systems. Please take a moment to confirm your credentials by clicking the button below:</p>
                    
                    <a href="${phishingLink}" style="background-color: red; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify My Account</a>
                    <p>This is an important security measure to ensure compliance with our updated IT policies. Failure to complete the verification process may result in the temporary deactivation of your account.</p>

                    <p>If you do not verify your account within the next 24 hours, your access to critical company resources may be temporarily suspended.</p>
                    <br>
                    <p>Thank you for your cooperation.</p>
                    <br>
                    <p>Best regards, </p> 
                    <p>IT Support Team</p>
                    
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ error: 'Error sending email' });
            }
            res.status(200).json({ message: 'Phishing email sent' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Handle phishing link clicked by employees
app.patch('/employee-clicked/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const cleanEmployeeId = employeeId.trim();
        const employee = await Employee.findById(cleanEmployeeId);
        if (employee) {
            employee.clicked = true; // Mark as clicked
            employee.clickTimestamp = new Date(); // Record timestamp
            await employee.save();
            res.json({ message: 'Employee click tracked', employee });
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error tracking click' });
    }
});

app.use('/api/auth', authRoutes);
app.use((req, res, next) => {
    res.status(404).send('<h1>404 Page Not Found</h1>');
  });
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
