import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async ()=>{
    try{
        const conn = await mongoose.connect(process.env.DATABASE_URL)
        console.log("server connected")
    } catch(err){
        console.error(`Database connection error ${err.message}`)
    }
}
export default connectDB