# Auth App - Learning Notes

## Overview
This is a complete authentication system built with Node.js, Express, MongoDB, JWT, and bcrypt. It demonstrates role-based access control (RBAC) with protected routes.

---

## 1. Application Architecture & Request Flow

### Entry Point: server.js
- **Express App Setup**: Creates an Express application instance
- **Environment Variables**: Uses `dotenv` to load configuration from `.env` file
- **JSON Parsing**: `app.use(express.json())` - Middleware to parse incoming JSON payloads
- **Database Connection**: Calls `dbConnect()` to establish MongoDB connection
- **Route Mounting**: Mounts all routes at `/api/v1` base path
- **Server Start**: Listens on specified PORT from environment variables

### Database Configuration (config/database.js)
- Uses Mongoose to connect to MongoDB
- Connection URL stored in environment variables
- Handles connection errors gracefully with `process.exit(1)` on failure
- Logs success/failure messages for debugging

---

## 2. Request Flow Through the Pipeline

### Example: Accessing Protected Student Route
```
Client Request → Server (server.js) → Routes (routes/user.js) → Middlewares (auth, isStudent) → Controller/Handler
```

**Step-by-Step Flow:**

1. **Client sends request** to `/api/v1/student`
2. **server.js receives request**
   - `express.json()` middleware parses the body
3. **Router matches route** in routes/user.js
   - Route: `router.get('/student', auth, isStudent, callback)`
4. **First Middleware: `auth`**
   - Extracts token from request body
   - Verifies token using JWT
   - Decodes payload and attaches to `req.user`
   - Calls `next()` to pass control
5. **Second Middleware: `isStudent`**
   - Checks if `req.user.role === 'Student'`
   - If yes, calls `next()` to proceed
   - If no, returns 401 error
6. **Final Handler** (callback function)
   - Sends success response with welcome message

**Key Insight**: Middlewares act as gatekeepers - each middleware can either:
- Call `next()` to pass to the next middleware
- Send a response and stop the chain
- This creates a pipeline where request flows through multiple validation layers

---

## 3. Middleware Concept

### What are Middlewares?
Middlewares are functions that have access to:
- **req** (request object)
- **res** (response object)  
- **next** (function to pass control to next middleware)

### Types Used in This App:

#### A. Built-in Middleware
```javascript
app.use(express.json()) // Parses JSON request bodies
```

#### B. Custom Authentication Middlewares (middlewares/auth.js)

**1. `auth` Middleware**
- **Purpose**: Verify if user is authenticated
- **Process**:
  - Extracts JWT token from `req.body.token`
  - Verifies token using `jwt.verify(token, JWT_SECRET)`
  - Decodes payload containing: `{email, id, role}`
  - Attaches decoded payload to `req.user` for downstream use
  - Calls `next()` if valid, returns error if invalid

**2. `isStudent` Middleware**
- **Purpose**: Role-based authorization
- **Process**:
  - Checks if `req.user.role === 'Student'`
  - Only allows Students to access the route
  - Must be used AFTER `auth` middleware (needs `req.user`)

**3. `isAdmin` Middleware**
- **Purpose**: Admin-only authorization
- **Process**:
  - Checks if `req.user.role === 'Admin'`
  - Only allows Admins to access the route

### Middleware Chaining
```javascript
router.get('/student', auth, isStudent, (req, res) => {...})
//                     1️⃣    2️⃣         3️⃣
// Execution order: auth → isStudent → callback
```

**Critical Concept**: `req.user` attachment in `auth` middleware
```javascript
// In auth middleware:
req.user = payload; // {email, id, role}

// Now isStudent and isAdmin can access:
if(req.user.role !== 'Student') {...}
```

---

## 4. bcrypt - Password Hashing

### Why bcrypt?
- Storing plain text passwords is **extremely dangerous**
- bcrypt creates a one-way hash (cannot be reversed)
- Includes salt (random data) to prevent rainbow table attacks

### Signup Process (controllers/Auth.js)
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```
- **Parameter 1**: Plain text password from user
- **Parameter 2**: Salt rounds (10) - higher = more secure but slower
- **Result**: Hashed string stored in database
- **Example**: "password123" → "$2b$10$abcd...xyz" (60 characters)

### Login Process
```javascript
await bcrypt.compare(password, user.password)
```
- **Parameter 1**: Plain text password from login request
- **Parameter 2**: Hashed password from database
- **Returns**: `true` if match, `false` otherwise
- bcrypt re-creates the hash using the same salt and compares

### Key Learning
- Never store plain passwords
- bcrypt handles salting automatically
- Salt rounds of 10 is a good balance (2^10 iterations)
- Each password gets a unique salt even if passwords are same

---

## 5. JWT (JSON Web Token)

### What is JWT?
A secure way to transmit information between parties as a JSON object. It's digitally signed so it can be verified and trusted.

### JWT Structure
```
header.payload.signature
```

**Example from this app's payload:**
```javascript
{
  email: "user@example.com",
  id: "507f1f77bcf86cd799439011",
  role: "Student"
}
```

### Token Generation (Login Controller)
```javascript
const payload = {
  email: user.email,
  id: user._id,
  role: user.role
};

let token = jwt.sign(payload, JWT_SECRET, {expiresIn: '2h'});
```

**Parameters:**
- **payload**: Data to encode (not sensitive - it's readable!)
- **JWT_SECRET**: Secret key from environment (used for signing)
- **options**: `expiresIn: '2h'` - token valid for 2 hours

### Token Verification (Auth Middleware)
```javascript
const payload = jwt.verify(token, JWT_SECRET);
```
- Checks if token is valid and not tampered with
- Checks if token hasn't expired
- Returns decoded payload if valid
- Throws error if invalid/expired

### Security Notes
- **JWT is encoded, NOT encrypted** - anyone can decode and read it
- Don't put sensitive data in payload (passwords, credit cards)
- Secret key must be kept secure
- Token expiration adds security layer

---

## 6. Cookies

### What are Cookies?
Small pieces of data stored in the browser and sent with every request to the same domain.

### Cookie Implementation (Login Controller)
```javascript
const options = {
  expires: new Date(Date.now() + 3*24*60*60*1000),
  httpOnly: true
};

res.cookie('token', token, options).status(200).json({...});
```

### Cookie Options Explained:

**1. `expires`**
- Sets when cookie should be deleted
- `3*24*60*60*1000` = 3 days in milliseconds
- After expiry, browser automatically deletes cookie

**2. `httpOnly: true`** (CRITICAL SECURITY)
- Cookie cannot be accessed by JavaScript (`document.cookie`)
- Prevents XSS (Cross-Site Scripting) attacks
- Only sent via HTTP requests, not accessible to client-side code
- This is why we send token in request body instead

### How Cookies Work
1. **Server sets cookie**: `res.cookie('token', token, options)`
2. **Browser stores cookie**: Automatically saved by browser
3. **Automatic sending**: Browser sends cookie with every request to this domain
4. **Server reads cookie**: Can access via `req.cookies.token` (needs cookie-parser middleware)

### Why Use Both Cookie and Response Body?
- **Cookie**: Automatic, browser handles it, secure with httpOnly
- **Response body**: Client can store in state/localStorage if needed
- This app sends token in both places for flexibility

### Cookie vs localStorage vs sessionStorage
- **Cookie**: Sent automatically, can set httpOnly, has expiration
- **localStorage**: Manual, accessible by JS, no expiration
- **sessionStorage**: Manual, accessible by JS, cleared on tab close

---

## 7. User Model (models/User.js)

### Schema Definition
```javascript
{
  name: {type: String, required: true, trim: true},
  email: {type: String, required: true, trim: true},
  password: {type: String, required: true},
  role: {type: String, enum: ["Admin", "Student", "Visitor"]}
}
```

### Key Features:
- **trim**: Removes whitespace from start/end
- **enum**: Restricts role to specific values only
- **required**: Field must be present

---

## 8. Routes Structure (routes/user.js)

### Public Routes (No authentication)
- `POST /api/v1/signup` → Creates new user
- `POST /api/v1/login` → Authenticates user, returns token

### Protected Routes (Require authentication)
- `GET /api/v1/test` → Protected by `auth` middleware only
- `GET /api/v1/student` → Protected by `auth` + `isStudent`
- `GET /api/v1/admin` → Protected by `auth` + `isAdmin`

### Route Protection Pattern
```javascript
router.get('/student', auth, isStudent, callback)
//                    ⬆️    ⬆️
//              Authentication | Authorization
```

---

## 9. Signup Flow (Complete)

1. **Client sends**: `{name, email, password, role}`
2. **Check existing user**: Query database by email
3. **Hash password**: `bcrypt.hash(password, 10)`
4. **Create user**: Save to database with hashed password
5. **Return response**: Success message (no token yet)

**Important**: Password is hidden before saving
```javascript
password: hashedPassword  // Stored in DB
```

---

## 10. Login Flow (Complete)

1. **Client sends**: `{email, password}`
2. **Validate input**: Check both fields present
3. **Find user**: Query database by email
4. **Check user exists**: Return error if not found
5. **Compare passwords**: `bcrypt.compare(password, user.password)`
6. **Create payload**: `{email, id, role}`
7. **Generate JWT**: `jwt.sign(payload, SECRET, {expiresIn: '2h'})`
8. **Hide password**: `user.password = undefined`
9. **Set cookie**: Store token in httpOnly cookie (3 days expiry)
10. **Return response**: Send token, user object, success message

**Important**: Password is removed before sending response
```javascript
user = user.toObject(); // Convert Mongoose doc to plain object
user.password = undefined; // Remove password
user.token = token; // Add token to response
```

---

## 11. Protected Route Access Flow

### Example: Student accessing `/api/v1/student`

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Flow:**
1. Request hits `/api/v1/student` endpoint
2. **First Middleware (`auth`)**:
   - Extracts token from `req.body.token`
   - Verifies: `jwt.verify(token, JWT_SECRET)`
   - Decodes payload: `{email, id, role: "Student"}`
   - Attaches: `req.user = {email, id, role: "Student"}`
   - Calls `next()`

3. **Second Middleware (`isStudent`)**:
   - Checks: `req.user.role === "Student"` ✅
   - Calls `next()`

4. **Route Handler**:
   - Returns success message

**If user was Admin:**
- `req.user.role === "Admin"`
- `isStudent` middleware checks: `"Admin" !== "Student"` ❌
- Returns 401 error: "This is a protected route for student"
- Route handler never executes

---

## 12. Key Security Concepts

### 1. Password Security
- ✅ Hashed with bcrypt (salt rounds: 10)
- ✅ Never returned in API responses
- ✅ Compared securely with `bcrypt.compare()`

### 2. Token Security
- ✅ JWT signed with secret key
- ✅ 2-hour expiration time
- ✅ Stored in httpOnly cookie (cannot be accessed by JavaScript)
- ⚠️ Token also sent in response body (client responsibility to secure)

### 3. Authorization Layers
- ✅ Authentication check (valid token?)
- ✅ Role-based authorization (correct role?)
- ✅ Middleware chaining for multiple checks

### 4. Error Handling
- ✅ Appropriate status codes (400, 401, 403, 500)
- ✅ Descriptive error messages
- ✅ Try-catch blocks in all async operations

---

## 13. Important Concepts Learned

### 1. Middleware Execution Order Matters
```javascript
router.get('/student', auth, isStudent, callback)
// MUST be in this order - isStudent needs req.user from auth
```

### 2. Converting Mongoose Document to Object
```javascript
user = user.toObject(); // Required before modifying properties
user.password = undefined; // Now we can safely delete password
```

### 3. httpOnly Cookies for Security
- Prevents XSS attacks by making token inaccessible to JavaScript
- Browser automatically sends with each request
- More secure than localStorage

### 4. Token in Request Body (Current Implementation)
```javascript
const token = req.body.token; // From request body
```
**Alternative locations** (mentioned as PENDING in code):
- `req.cookies.token` - From cookie (needs cookie-parser)
- `req.headers.authorization` - From Authorization header

### 5. JWT Expiration Strategy
- **Token expires**: 2 hours (`expiresIn: '2h'`)
- **Cookie expires**: 3 days
- Mismatch means cookie persists but token inside becomes invalid
- User must re-login after 2 hours

### 6. Role-Based Access Control (RBAC)
- Single source of truth: `role` field in User model
- Roles stored in JWT payload for quick access
- Middleware checks role without database query

---

## 14. Dependencies Used

### Production Dependencies
- **express**: Web framework for Node.js
- **mongoose**: MongoDB ODM (Object Data Modeling)
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT creation and verification
- **dotenv**: Environment variable management
- **cookie-parser**: Parse cookies (installed but not used currently)

### Development Dependencies
- **nodemon**: Auto-restart server on file changes

---

## 15. Environment Variables Required

```
PORT=4000
DATABASE_URL=mongodb://localhost:27017/authApp
JWT_Secret=your_super_secret_key_here
```

---

## 16. API Endpoints Summary

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/v1/signup | ❌ | Any | Create new user |
| POST | /api/v1/login | ❌ | Any | Login and get token |
| GET | /api/v1/test | ✅ | Any | Test authentication |
| GET | /api/v1/student | ✅ | Student | Student-only route |
| GET | /api/v1/admin | ✅ | Admin | Admin-only route |

---

## 17. Data Flow Diagram

```
CLIENT
   ↓
[Request: POST /api/v1/login]
   ↓
SERVER.JS
   ↓
[Middleware: express.json()]
   ↓
ROUTES/USER.JS
   ↓
CONTROLLERS/AUTH.JS (login function)
   ↓
[1. Validate input]
   ↓
[2. Find user in DB]
   ↓
[3. bcrypt.compare(password)]
   ↓
[4. jwt.sign(payload)]
   ↓
[5. Set cookie]
   ↓
[6. Return response]
   ↓
CLIENT
[Receives: token, user object]
   ↓
[Next Request: GET /api/v1/student with token]
   ↓
MIDDLEWARES/AUTH.JS (auth function)
   ↓
[1. Extract token]
   ↓
[2. jwt.verify(token)]
   ↓
[3. Set req.user = payload]
   ↓
MIDDLEWARES/AUTH.JS (isStudent function)
   ↓
[1. Check req.user.role === 'Student']
   ↓
ROUTE HANDLER
   ↓
[Return success response]
   ↓
CLIENT
```

---

## 18. Best Practices Observed

✅ **Separation of Concerns**: Routes, controllers, middlewares, models in separate files
✅ **Environment Variables**: Sensitive data in .env file
✅ **Error Handling**: Comprehensive try-catch blocks
✅ **Password Security**: Never store or return plain passwords
✅ **Token Expiration**: Limited lifetime for security
✅ **Status Codes**: Proper HTTP status codes (200, 400, 401, 403, 500)
✅ **Validation**: Check user existence, input validation
✅ **Database Error Handling**: Graceful exit on connection failure

---

## 19. Potential Improvements (Learning Points)

1. **Token Extraction**: Implement multiple sources (header, cookie, body)
2. **Refresh Tokens**: Add refresh token mechanism for better UX
3. **Email Validation**: Use regex or validator library
4. **Password Strength**: Enforce strong password requirements
5. **Rate Limiting**: Prevent brute force attacks on login
6. **Logging**: Add proper logging system (Winston, Morgan)
7. **CORS**: Configure CORS for frontend integration
8. **Input Sanitization**: Prevent NoSQL injection
9. **Token Blacklisting**: Implement logout by invalidating tokens
10. **Cookie-Parser Usage**: Currently installed but not used in token extraction

---

## 20. Key Takeaways

1. **Middlewares are powerful**: They create reusable authentication/authorization layers
2. **next() is crucial**: Without it, request pipeline stops
3. **req.user pattern**: Attach decoded user data for downstream use
4. **bcrypt is one-way**: Cannot decrypt hashed passwords
5. **JWT is stateless**: Server doesn't store sessions, everything is in token
6. **httpOnly cookies**: Best practice for storing sensitive tokens
7. **Role-based access**: Efficient authorization without database queries
8. **Middleware chaining**: Multiple layers of security checks
9. **Password handling**: Hash on signup, compare on login, never expose
10. **Token lifecycle**: Generation → Storage → Verification → Expiration
