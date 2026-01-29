# Auth App 🔐

A robust backend authentication application built with Node.js, Express, and MongoDB. This application provides secure user authentication with role-based access control (RBAC) supporting multiple user roles.

## ✨ Features

- **User Authentication**: Secure signup and login functionality
- **Password Security**: Password hashing using bcrypt
- **JWT Authentication**: Token-based authentication with JSON Web Tokens
- **Role-Based Access Control**: Support for multiple user roles (Admin, Student, Visitor)
- **Protected Routes**: Middleware-based route protection
- **Cookie Parser**: Secure cookie handling for token storage

## 🛠️ Technologies Used

- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT implementation
- **dotenv**: Environment variable management
- **cookie-parser**: Cookie parsing middleware

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- MongoDB installed and running
- npm or yarn package manager

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/Raaghav-09/Auth-app.git
cd Auth-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=4000
DATABASE_URL=mongodb://localhost:27017/authDB
JWT_SECRET=your_jwt_secret_key_here
```

4. Start MongoDB service (if not already running)

## 💻 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start at `http://localhost:4000` (or your specified PORT).

## 📡 API Endpoints

### Authentication

#### Signup
- **POST** `/api/v1/signup`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "Student"
}
```

#### Login
- **POST** `/api/v1/login`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Protected Routes

#### Test Route (All Authenticated Users)
- **GET** `/api/v1/test`
- **Headers**: `Authorization: Bearer <token>`

#### Student Route
- **GET** `/api/v1/student`
- **Headers**: `Authorization: Bearer <token>`
- **Access**: Only users with "Student" role

#### Admin Route
- **GET** `/api/v1/admin`
- **Headers**: `Authorization: Bearer <token>`
- **Access**: Only users with "Admin" role

## 📁 Project Structure

```
Auth App/
├── config/
│   └── database.js          # Database connection configuration
├── controllers/
│   └── Auth.js              # Authentication controllers
├── middlewares/
│   └── auth.js              # Authentication & authorization middlewares
├── models/
│   └── User.js              # User model schema
├── routes/
│   └── user.js              # User routes
├── .env                     # Environment variables (create this)
├── .gitignore              # Git ignore file
├── package.json            # Project dependencies
├── server.js               # Application entry point
└── README.md               # Project documentation
```

## 🔒 Security Features

- Passwords are hashed using bcrypt with salt rounds
- JWT tokens for stateless authentication
- Role-based access control for protected routes
- Secure cookie handling
- Environment variables for sensitive data

## 👥 User Roles

- **Admin**: Full access to admin routes
- **Student**: Access to student-specific routes
- **Visitor**: Basic access

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

ISC

## 👨‍💻 Author

Your Name

---

**Note**: Make sure to keep your `.env` file secure and never commit it to version control. Add it to your `.gitignore` file.
