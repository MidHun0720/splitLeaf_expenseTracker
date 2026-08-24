import express from 'express'
import connectDB from './config/db.js'
import authroutes from './routes/authroutes.js'
import cors from 'cors'
import 'dotenv/config';
import grouproutes from './routes/groupRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import settlementRoutes from './routes/settlementRoutes.js'
const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/auth', authroutes)
app.use('/api/groups',grouproutes)
app.use('/api/expenses',expenseRoutes)
app.use('/api/settlements', settlementRoutes)
const PORT = process.env.PORT || 3000
await connectDB()
app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`)
})

export default app