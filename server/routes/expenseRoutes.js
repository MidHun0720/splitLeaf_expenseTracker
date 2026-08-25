import express from 'express'
import Expense from '../models/Expense.js'
import Group from '../models/Group.js'
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

router.get('/group/:groupId/balances', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params
    const group = await Group.findById(groupId).populate('members', 'name email')
    if (!group) {
      return res.status(404).json({ error: "Group not found" })
    }

    const expenses = await Expense.find({ group: groupId }).populate('paidBy', 'name email').populate('splitAmong', 'name email')
    const balances = {}

    group.members.forEach(member => {
      balances[member._id.toString()] = 0
    })

    expenses.forEach(expense => {
      if (!expense.splitAmong || expense.splitAmong.length === 0) return
      const share = expense.totalAmount / expense.splitAmong.length
      const payerId = (expense.paidBy?._id || expense.paidBy).toString()
      balances[payerId] = (balances[payerId] || 0) + expense.totalAmount
      
      expense.splitAmong.forEach(user => {
        const id = (user?._id || user).toString()
        balances[id] = (balances[id] || 0) - share
      })
    })

    const settlements = await Settlement.find({ group: groupId }).populate('from', 'name email').populate('to', 'name email')
    settlements.forEach(settlement => {
      const fromId = (settlement.from?._id || settlement.from).toString()
      const toId = (settlement.to?._id || settlement.to).toString()
      balances[fromId] = (balances[fromId] || 0) + settlement.amount
      balances[toId] = (balances[toId] || 0) - settlement.amount
    })

    const memberMap = {}
    group.members.forEach(m => {
      memberMap[m._id.toString()] = { _id: m._id, name: m.name, email: m.email }
    })

    expenses.forEach(e => {
      if (e.paidBy?._id) memberMap[e.paidBy._id.toString()] = { _id: e.paidBy._id, name: e.paidBy.name, email: e.paidBy.email }
      if (Array.isArray(e.splitAmong)) {
        e.splitAmong.forEach(m => {
          if (m?._id) memberMap[m._id.toString()] = { _id: m._id, name: m.name, email: m.email }
        })
      }
    })
    settlements.forEach(s => {
      if (s.from?._id) memberMap[s.from._id.toString()] = { _id: s.from._id, name: s.from.name, email: s.from.email }
      if (s.to?._id) memberMap[s.to._id.toString()] = { _id: s.to._id, name: s.to.name, email: s.to.email }
    })

    const debtors = []
    const creditors = []

    for (const [userId, net] of Object.entries(balances)) {
      const rounded = Math.round(net * 100) / 100
      balances[userId] = rounded
      if (rounded < -0.01) {
        debtors.push({ userId, amount: -rounded })
      } else if (rounded > 0.01) {
        creditors.push({ userId, amount: rounded })
      }
    }

    debtors.sort((a, b) => b.amount - a.amount)
    creditors.sort((a, b) => b.amount - a.amount)

    const debts = []
    let dIdx = 0
    let cIdx = 0

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx]
      const creditor = creditors[cIdx]
      const settleAmount = Math.min(debtor.amount, creditor.amount)

      if (settleAmount > 0.01) {
        const roundedAmount = Math.round(settleAmount * 100) / 100
        debts.push({
          from: debtor.userId,
          fromUser: memberMap[debtor.userId] || { _id: debtor.userId, name: 'Member', email: '' },
          to: creditor.userId,
          toUser: memberMap[creditor.userId] || { _id: creditor.userId, name: 'Member', email: '' },
          amount: roundedAmount
        })
      }

      debtor.amount -= settleAmount
      creditor.amount -= settleAmount

      if (debtor.amount < 0.01) dIdx++
      if (creditor.amount < 0.01) cIdx++
    }

    res.status(200).json({ balances, debts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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