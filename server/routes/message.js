
import { addMessage, getMessage } from "../controllers/messageController.js";
import { Router } from "express";

const messageRouter = Router();

messageRouter.post('/addmsg', addMessage);
messageRouter.post('/getmsg', getMessage);

export default messageRouter;