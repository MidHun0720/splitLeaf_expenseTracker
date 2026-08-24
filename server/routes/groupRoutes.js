import express from 'express'
import Group from '../models/Group.js'
import authenticateToken from '../middleware/authMiddleware.js'
import User from '../models/User.js'
import Expense from '../models/Expense.js'
const router = express.Router()

router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body
        const newGroup = await Group.create({
            name,
            createdBy: req.user.id,
            members: [req.user.id]
        })
        res.status(201).json(newGroup)
    }
    catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get('/my-groups', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
    res.status(200).json(groups)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.status(200).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:groupId/add-member', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params
    const { email } = req.body
    const group = await Group.findById(groupId)
    const user = await User.findOne({ email })
    if (!group) {
      return res.status(404).json({ error: "Group does not exist" })
    }
    if (!user) {
      return res.status(404).json({ error: "User with this email does not exist" })
    }
    const isAlreadyMember = group.members.some(memberId => memberId.toString() === user._id.toString());
    if (isAlreadyMember) {
      return res.status(409).json({ error: "User is already a member of this group" })
    } else {
      group.members.push(user._id);
      await group.save();
    }
    const updatedGroup = await Group.findById(groupId)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
    res.status(200).json(updatedGroup)
  }
  catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:groupId/remove-member', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params
        const { email } = req.body
        const user = await User.findOne({ email })
        const group = await Group.findById(groupId)

        if (!group) {
          return res.status(404).json({ error: "Group does not exist" })
        }
        if (!user) {
          return res.status(404).json({ error: "User with this email does not exist" })
        }

        // Determine creator: group.createdBy or first member as fallback
        const creatorId = group.createdBy 
          ? group.createdBy.toString() 
          : (group.members.length > 0 ? group.members[0].toString() : null);

        // Only group creator is allowed to kick members
        if (!creatorId || req.user.id !== creatorId) {
          return res.status(403).json({ error: "Only the person who created the group can remove members" })
        }

        // Creator cannot kick themselves
        if (user._id.toString() === creatorId) {
          return res.status(400).json({ error: "The group creator cannot be removed from the group" })
        }

        const isAlreadyMember = group.members.some(memberId => memberId.toString() === user._id.toString());
        if (!isAlreadyMember) {
          return res.status(400).json({ error: "Cannot remove user that is not a member" })
        }

        const newGroup = await Group.findByIdAndUpdate(
          groupId, 
          { $pull: { members: user._id } }, 
          { new: true }
        ).populate('members', 'name email').populate('createdBy', 'name email');
  
        res.status(200).json(newGroup)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

export default router