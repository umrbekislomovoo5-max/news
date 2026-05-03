import { login, register, getAllUsers, setAvatar, logOut } from '../controllers/userController.js';
import { Router } from 'express';

const authRouter = Router();

authRouter.post('/login', login);
authRouter.post('/register', register);
authRouter.get('/allusers/:id', getAllUsers);
authRouter.post('/setavatar/:id', setAvatar);
authRouter.get('/logout/:id', logOut);

export default authRouter;
