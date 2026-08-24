import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    group:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Group',
        required: true
    },
    description:{
        type: String,
        required: true
    },
    totalAmount:{
        type: Number,
        required:true
    },
    paidBy:{
        type:mongoose.Schema.Types.ObjectId,
         ref:'User',
         required: true
    },
    splitAmong:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'User'
    }
})

const Expense = mongoose.model('Expense',expenseSchema)
export default Expense