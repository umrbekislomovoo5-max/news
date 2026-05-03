import mongoose, { Schema } from "mongoose";
const MessageSchema=new Schema({
    message:{
        text:{
            type:String,
            required:true
        }},

    users:Array,
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    }

    
},{
    timestamps:true
})
export default mongoose.model('Messages',MessageSchema)