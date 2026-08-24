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


