import express from 'express'
import bcrypt from 'bcrypt'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import authenticateToken from '../middleware/authMiddleware.js'
const router = express.Router()

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await User.create({ name, email, password: hashedPassword })
        res.status(201).json({ id: newUser._id, name: newUser.name, email: newUser.email });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const plainPassword = password
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" })
        }
        
        const comparedPassword = await bcrypt.compare(plainPassword, user.password)   
        if (!comparedPassword) {
            return res.status(401).json({ error: "Invalid credentials" })
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' })
        res.status(200).json({ token, id: user._id, name: user.name, email: user.email });
    }
    catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "You are authenticated", user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router