import mongoose, { Schema } from "mongoose";
const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        min:3,
        max:20,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        max:50
    },
    password:{
        type:String,
        required:true,
        min:8
    },
    isAvatarImageset:{
        type:Boolean,
        default:false,
    },
    avatarImage:{
        type:String,
        default:"",
    }
    }
);


export  default  mongoose.model("Users",userSchema)