import User from "../model/userModel.js";
import bcrypt from "bcrypt";
const login=async (req,res,next)=>{
    try{
        const {username, password}=req.body;
        const user=await User.findOne({
            username
        });
        if(!user)
            return res.json({
        msg:"incorrect Username or Password",status:false});
        const isPasswordValid=await bcrypt.compare(password, user.password);
        if(!isPasswordValid)  
            return res.json({
            msg:"incorrect Username or Password",status:false});
        delete user.password;
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

const register=async (req,res,next)=>{
    try{
        const {username,email,password}=req.body;
        const usernameCheck=await User.findOne({username})
        if(usernameCheck)
            return res.json(({msg:"username already used",status:false}))
        const emailCheck=await User.findOne({email});
        if(emailCheck)
            return res.json({msg:"Email already used", status:false});
    const hashedPassword=await bcrypt.hash(password,10);
    const user=await User.create({
        email,
        username,
        password:hashedPassword,
    });
    delete user.password;
    return res.json({
        status:true,
        user
    })
}catch(er){    
    next(er)
}}
            
const getAllusers=async(req,res,next)=>{
    try{
        const users=await User.find({
            _id:{
                $ne:req.params.id
            }
        }).select([
            "email","username","avatarImage","_id"
        ]);
        return res.json(users);

    }catch(er){
        next(er)
    }
}

const setAvatar=async(req,res,next)=>{
    try{
        const userId=req.params.id;
        const avatarImage=req.body.image;
        const userData=await User.findByIdAndUpdate(
            userId,{
                isAvatarImageset:true,
                avatarImage
            },
            {new :true}
        );
        return res.json({
            isset:userData.isAvatarImageset,
            image:userData.avatarImage
        });

    }catch(er){
        next(er)
    }

};
const  logOut=async(req,res, next)=>{
    try{
        if(!req.params.id)
            return res.json({
        msg:"user id is required"});
        global.onlineUsers.delete(req.params.id);
        return res.status(200).send();            
    }catch(er){
        next(er);
    }
    }

const getAllUsers = getAllusers;
export { login, logOut, register, setAvatar, getAllusers, getAllUsers }