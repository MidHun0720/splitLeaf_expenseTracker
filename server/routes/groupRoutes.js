import express, { Router } from 'express'
import Group from '../models/Group.js'
import authenticateToken from '../middleware/authMiddleware.js'
import User from '../models/User.js'
import Expense from '../models/Expense.js'
const router = express.Router()

router.post('/create', authenticateToken, async (req, res) =>{
    try{
        const {name} = req.body
        const newGroup = await Group.create({
            name,
            members : [req.user.id]
        })
        res.status(201).json(newGroup)
    }
    catch(err){
        res.status(500).json({error:err.message})
    }
    

})

router.get('/my-groups', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
    res.status(200).json(groups)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('members','name email');

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/:groupId/add-member', authenticateToken, async (req, res) => {
  try{
    const{groupId} = req.params
    const{email} = req.body
    const group = await Group.findById(groupId)
    const user = await User.findOne({email})
    if(!group){
      return res.status(401).json({error:"Group does not exist"})
    }
    if(!user){
      return res.status(401).json({error:"Mail does not exist"})
    }
    const isAlreadyMember = group.members.some(memberId => memberId.toString() === user._id.toString());
    if(isAlreadyMember){
      return res.status(409).json({error:"User already exists"})
    }
    else{
      group.members.push(user._id);
      await group.save();
    }
    res.status(200).json(group)
  }
  catch(err){
    res.status(500).json({error:err.message})
}})

router.post('/:groupId/remove-member', authenticateToken, async (req, res) => {
    try{
        const { groupId } = req.params
        const{email} = req.body
        const user = await User.findOne({email})
        const group = await Group.findById(groupId)
        if(!group){
      return res.status(401).json({error:"Group does not exist"})
    }
    if(!user){
      return res.status(401).json({error:"Mail does not exist"})
    }

    const isAlreadyMember = group.members.some(memberId => memberId.toString() === user._id.toString());
    if(!isAlreadyMember){
      return res.status(409).json({error:"Cannot remove user that is not a member"})
    }

       const newGroup = await Group.findByIdAndUpdate(groupId, { $pull: { members: user._id } }, { new: true })
  
    res.status(200).json(newGroup)

    }catch(err){
      res.status(500).json({error:err.message})
    }
})




export default router