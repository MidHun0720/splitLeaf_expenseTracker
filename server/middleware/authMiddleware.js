import jwt from 'jsonwebtoken'
import 'dotenv/config';


export default function authenticateToken(req,res,next){
    const authHeader = req.headers['authorization']
    console.log("Raw auth header:", req.headers['authorization']);
    const token = authHeader && authHeader.split(' ')[1]
    if(token==null) return res.status(401).json({error:"invalid token"})
        jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
    if(err) {
        return res.status(403).json({error:"invalid token"})
    }   
         req.user = user
        next()
    })

}