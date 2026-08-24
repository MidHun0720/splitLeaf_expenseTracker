import express from 'express'
import Expense from '../models/Expense.js'
import authenticateToken from '../middleware/authMiddleware.js'
import Settlement from '../models/Settlement.js'
const router = express.Router()
router.post('/create', authenticateToken, async (req, res) => {
    try{
        const {group, description, totalAmount, splitAmong} = req.body
        const newExpense = await Expense.create({
            group, description, totalAmount, splitAmong,
            paidBy: req.user.id
        })
        res.status(201).json(newExpense)
    }
    catch(err){
        res.status(500).json({err:err.message})
    }


})

router.get('/group/:groupId/balances',authenticateToken,async (req,res)=>{
  try{
    const {groupId} = req.params
    const expenses = await Expense.find({ group: groupId })
    const balances = {}

    expenses.forEach(expense=>{
      const share = expense.totalAmount/expense.splitAmong.length
      const payerId = expense.paidBy.toString()
      balances[payerId] = (balances[payerId] || 0) + expense.totalAmount
      expense.splitAmong.forEach(userId=>{
        const id = userId.toString()
        balances[id] = (balances[id]||0) - share
      })
    })

    const settlements = await Settlement.find({ group: groupId })
    settlements.forEach(settlement=>{
      const fromId = settlement.from.toString()
      const toId = settlement.to.toString()
      balances[fromId] = (balances[fromId] || 0) + settlement.amount
      balances[toId] = (balances[toId] || 0) - settlement.amount
    })

    res.status(200).json(balances)

  }catch(err){
    res.status(500).json({error:err.message})
  }
  }
)

router.get('/group/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params
    const expense = await Expense.find({group:groupId}).populate('paidBy','name email')

    res.status(200).json(expense)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:expenseId', authenticateToken, async (req, res) => {
  try{
      const {expenseId} = req.params
      const expense = await Expense.findById(expenseId)
      if(!expense){
        return res.status(404).json({error:"Expense not found"})
      }
      if(!(expense.paidBy.toString()===req.user.id)){
        return res.status(403).json({error:"Only the creater can deleted this expense"})
      }
      await Expense.findByIdAndDelete(expenseId)
      res.status(200).json({ message: 'Successfully deleted' })
  }
  catch(err){
    res.status(500).json({error:err.message})
  }


})

router.put('/:expenseId', authenticateToken, async (req, res) => {
  try{
    const {expenseId} = req.params
    const {description, totalAmount, splitAmong} = req.body
    const expense = await Expense.findById(expenseId)

    if(!expense){
        return res.status(404).json({error:"Expense not found"})
      }
    if(!(expense.paidBy.toString()===req.user.id)){
        return res.status(403).json({error:"Only the creater can deleted this expense"})
      }

    const updatedExpense = await Expense.findByIdAndUpdate(expenseId, { description, totalAmount, splitAmong }, { new: true })

    res.status(200).json(updatedExpense)
  }
  catch(err){
    res.status(500).json({error:err.message})
  }
})

export default router