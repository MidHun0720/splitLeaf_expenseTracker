# 🍃 SplitLeaf — Expense Tracker

A full-stack group expense splitting application built with Node.js, Express, MongoDB, and React (Vite), styled with a MongoDB LeafyGreen-inspired design system.

---

## ✨ Features

- **Authentication**: JWT-based sign up, login, and protected routes.
- **Groups Management**: Create groups, invite members by email, and manage membership.
- **Expense Tracking**: Add expenses, split equally among members, and edit/delete own expenses.
- **Group Balances**: Automatically calculated net balances for all members (+owed / -owes / settled).
- **Settlement Records**: Record payments when members settle their balances.
- **Modern UI**: MongoDB LeafyGreen dark-teal theme with responsive layouts and pill buttons.

---

## 🛠️ Project Structure

```
Expense_Tracker/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── api/         # Axios instance
│   │   ├── components/  # Navbar, Modals, Cards, Expense/Balance items
│   │   ├── context/     # Auth Context
│   │   └── pages/       # Login, Signup, Dashboard, GroupDetail
├── server/              # Node.js Express backend
│   ├── config/          # MongoDB connection
│   ├── middleware/      # JWT authentication middleware
│   ├── models/          # Mongoose schemas (User, Group, Expense, Settlement)
│   └── routes/          # API route handlers
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### 2. Configure Backend Environment
Create a `.env` file in the `server` directory based on `.env.example`:
```bash
cd server
cp .env.example .env
```
Fill in your MongoDB connection string and JWT secret:
```env
PORT=3000
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### 3. Install Dependencies & Run

#### Server:
```bash
cd server
npm install
npm start # or node server.js
```

#### Client:
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

