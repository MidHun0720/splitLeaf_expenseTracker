import express from 'express'
import authenticateToken from'../middleware/authMiddleware.js'
import Settlement from '../models/Settlement.js'
const router = express.Router()

router.post('/create', authenticateToken, async (req, res) => {
    try{
        const {group,to,amount} = req.body
        
        const newSettlement = await Settlement.create({
            group,
            to,
            amount,
            from: req.user.id
        })
        res.status(201).json(newSettlement)
    }
    catch(err){
        res.status(500).json({err:err.message})
    }
   


})

router.get('/group/:groupId', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params
        const settlementList = await Settlement.find({group:groupId}).populate('from','name email').populate('to', 'name email')
    
        res.status(200).json(settlementList)
      } catch (err) {
        res.status(500).json({ error: err.message })
      }
})



export default router