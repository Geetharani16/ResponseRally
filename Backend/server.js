require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Logging middleware to debug requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// In-memory storage for sessions (in production, use a database like MongoDB or PostgreSQL)
let sessions = new Map();
let providers = [
  { id: 'gpt', name: 'GPT-4', displayName: 'OpenAI GPT-4', enabled: true },
  { id: 'llama', name: 'LLaMA', displayName: 'Meta LLaMA', enabled: true },
  { id: 'mistral', name: 'Mistral', displayName: 'Mistral AI', enabled: true },
  { id: 'gemini', name: 'Gemini', displayName: 'Google Gemini', enabled: true },
  { id: 'copilot', name: 'Copilot', displayName: 'Microsoft Copilot', enabled: true },
  { id: 'deepseek', name: 'DeepSeek', displayName: 'DeepSeek', enabled: true }
];

// Helper function to create a new session
const createSession = () => {
  return {
    id: uuidv4(),
    conversationHistory: [],
    currentPrompt: '',
    currentResponses: [],
    isProcessing: false,
    selectedResponseId: null,
    enabledProviders: providers.filter(p => p.enabled).map(p => p.id),
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// In-memory storage for users and OTPs
let users = new Map();
let otpStore = new Map();

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'myspace.otp@gmail.com',
    pass: 'cwtp aowz oded tqcn'
  }
});

// Generate OTP
const generateOTP = () => {
  const secret = '948563';
  const token = speakeasy.totp({
    secret: secret,
    encoding: 'base32',
    step: 600, // 10 minutes
    digits: 6
  });
  return token;
};

// Send OTP via email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: 'myspace.otp@gmail.com',
    to: email,
    subject: 'ResponseRally - Your OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">ResponseRally</h1>
          <p style="color: #e0e0e0; margin: 10px 0 0 0;">AI Benchmarking & Research Interface</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Your OTP Code</h2>
          <p style="color: #666; font-size: 16px;">Please use the following code to complete your authentication:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 14px;">This code is valid for 10 minutes. If you didn't request this code, please ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 ResponseRally. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    console.log('Sending OTP email to:', email);
    console.log('OTP code:', otp);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.response) {
      console.error('Error response:', error.response);
    }
    return false;
  }
};

// Validate user credentials
const validateCredentials = (email, password, isLogin) => {
  if (isLogin) {
    // For login, check if user exists and password matches
    const user = users.get(email);
    if (!user) {
      return { valid: false, error: 'User not found. Please register first.' };
    }
    if (user.password !== password) {
      return { valid: false, error: 'Invalid password' };
    }
    return { valid: true };
  } else {
    // For registration, check if user already exists
    if (users.has(email)) {
      return { valid: false, error: 'User already exists. Please login.' };
    }
    return { valid: true };
  }
};

// API Routes for OTP Authentication
app.post('/api/v1/auth/request-otp', async (req, res) => {
  console.log('=== OTP Request Received ===');
  console.log('Request body:', req.body);
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const { email, password, isLogin, name } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Validating credentials for:', email);
    // Validate credentials first
    const validation = validateCredentials(email, password, isLogin);
    if (!validation.valid) {
      console.log('Credential validation failed:', validation.error);
      return res.status(400).json({ error: validation.error });
    }

    console.log('Credentials valid, generating OTP...');
    // If registration, create user
    if (!isLogin) {
      users.set(email, { email, password, name, createdAt: new Date() });
      console.log('New user registered:', email);
    }

    const otp = generateOTP();
    console.log('Generated OTP:', otp);
    otpStore.set(email, {
      otp,
      createdAt: Date.now(),
      isLogin
    });

    console.log('Sending OTP email...');
    const emailSent = await sendOTPEmail(email, otp);
    
    if (emailSent) {
      console.log('OTP email sent successfully to:', email);
      res.json({ 
        success: true, 
        message: 'OTP sent successfully',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
    } else {
      console.log('Failed to send OTP email to:', email);
      res.status(500).json({ error: 'Failed to send OTP email' });
    }
  } catch (error) {
    console.error('Error in request-otp:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/auth/verify-otp', (req, res) => {
  console.log('=== OTP Verification Received ===');
  console.log('Request body:', req.body);
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      console.log('Missing email or OTP');
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    console.log('Verifying OTP for:', email);
    const storedData = otpStore.get(email);
    
    if (!storedData) {
      console.log('No OTP found for email:', email);
      return res.status(400).json({ error: 'No OTP found for this email' });
    }

    // Check if OTP is expired (10 minutes)
    if (Date.now() - storedData.createdAt > 10 * 60 * 1000) {
      console.log('OTP expired for:', email);
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Verify OTP
    if (storedData.otp === otp) {
      console.log('OTP verified successfully for:', email);
      otpStore.delete(email); // Remove used OTP
      res.json({ 
        success: true, 
        message: 'Authentication successful',
        isLogin: storedData.isLogin
      });
    } else {
      console.log('Invalid OTP for:', email);
      res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import the app module which contains all the routes
const appModule = require('./src/app');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});



// Start the server
app.listen(PORT, () => {
  console.log(`ResponseRally Backend server running on port ${PORT}`);
});

module.exports = app;