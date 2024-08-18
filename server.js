const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const session = require('express-session')
const mongodbSession = require('connect-mongodb-session')(session)

//import 
const userModel = require('./Models/userSchema');
const { dataValidation, isEmailValid } = require('./utils/authUtil');
const isAuth = require('./middlewares/isAuthMiddleware');
const { todoValidation } = require('./utils/todoUtil');
const { todoModel } = require('./Models/todoModel');
const { reqRateLimiting } = require('./middlewares/reqRateLimitingMiddleware');

//constants
const PORT = process.env.PORT ;
const app = express();
const MONGO_URI = process.env.MONGO_URI;
//sesstion Store 
const store = new mongodbSession({
    uri :MONGO_URI,
    collection : "sessions"
})

//mongoose connection 
mongoose.connect(MONGO_URI)
.then(()=>console.log('Data base Connected'))
.catch(err=>console.log(err));

//middleware 
app.set('view engine','ejs')
app.use(express.urlencoded({extended:true}));
app.use(express.json());
//static file middleware 
app.use(express.static("public"))
//session middleware 
app.use(session({
    secret: process.env.SECRET_KEY,
    store: store,
    resave: false,
    saveUninitialized: false,
}))

app.get('/',(req,res)=>{
    return res.send('server is running...')
})
// render register page 
app.get('/register',(req,res)=>{
    return res.render('registerPage')
})
// render login page 
app.get ('/login',(req,res)=>{
    return res.render('loginPage')
})

//register POST api
app.post('/register',async(req,res)=>{
    const {name,username,email,password} = req.body;
    try {
        await dataValidation({name,username,email,password});
    } catch (error) {
        return res.status(400).json(error)
    }
    try{
        let userdb = await userModel.findOne({email:email});
        if(userdb){
            return res.status(400).json('email is already registered.Please login')
        }
        userdb = await userModel.findOne({username:username});
        if(userdb){
            return res.status(400).json('UserName is already Used.')
        }
        else{
            // hash password 
            const hashPassword = await bcrypt.hash(password,Number(process.env.SALT));
            const userObj = new userModel({
                name,
                username,
                email,
                password: hashPassword
            });
                const userDB = await userObj.save();
                return res.status(201).json({message: ' User registered successfully' , data: userDB});
        }
    }
    catch(error){
        return res.status(500).json({message:"Internal server error", error: error});
    }
})

// login POST api 
app.post('/login',async(req,res)=>{

    const {username,password}= req.body;
  
    if(!username || !password){
        return res.status(400).json("Missing user LoginId/Password")
    }
    if(typeof username !== 'string')
        return res.status(400).json("LoginId is not a text")
    if(typeof password !== 'string')
        return res.status(400).json("Password is not a text")

    try {
        let userDbExist  = {}
        // Finding user exist or not through Username/ Email
        if(isEmailValid({key:username})){
            userDbExist = await userModel.findOne({email:username})
        }else{
            userDbExist = await userModel.findOne({username:username});
        }
        // If user not found 
        if(!userDbExist){
            return res.status(400).json('Incorrect Username/Email. User not found')
        }else{// user found then comparing password 
            const isMatch = await bcrypt.compare(password,userDbExist.password)
          
            if(!isMatch){//if password does not match
                return res.status(400).json('Incorrect Password')
            }//if password matched 
            req.session.isAuth = true;
            req.session.user ={
                userID: userDbExist._id,
                username: userDbExist.username,
                userEmail: userDbExist.email
            }
            return  res.status(200).json("Login successfully");
        }    
    } catch (error) {
        return res.status(500).json({message:"Internal server error", error: error});
    }
    
});

//dashboard 
app.get('/dashboard',isAuth,(req,res)=>{
   return res.render('dashboardPage');
})

// logout api 
app.post("/logout",isAuth,(req,res)=>{
    req.session.destroy((error)=>{
        if(error) return res.status(500).json(error);
        else return res.status(200).json('logout successfull')
    })
})

//logout-out-from-all API
app.post('/logout-out-from-all',isAuth,async(req,res)=>{
    const username = req.session.user.username;
    const sessionSchema = new mongoose.Schema({_id: String },{strict: false});
    const sessionModel = mongoose.model('session',sessionSchema);

    try {
        const deleteDB =sessionModel.deleteMany({"session.user.username": username});
        return res.status(200).json(`logout from ${(await deleteDB).deletedCount} devices successfully`)
    } catch (error) {
        return res.status(500).json(error);
    }
})

//create-todo-item API

app.post("/create-item",isAuth,reqRateLimiting,async(req,res)=>{
    const username = req.session.user.username;
    const todoText = req.body.todoText;
  
    try{
        await todoValidation({todoText})
    }catch(error){
        return res.send({status: 400 , message: error})
    }
    try{
        const userTodoObj = new todoModel({ todoText , username});
        const userTodoDB = await userTodoObj.save();
        
        return res.send({status: 201 , message: "data added successfully", data:userTodoDB});
    }catch(error){
        return res.send({status:500 ,message:"Internal server error", error: error});
    }
    
})

// Reading todo list
app.get("/read-item",isAuth,async(req,res)=>{
    
    const username = req.session.user.username;
    const SKIP= parseInt(req.query.skip) || 0;

    try{
        // const userDataDB = await todoModel.find({username});
        const userDataDB = await todoModel.aggregate([
            {$match:{username}},
            {$skip: SKIP},
            {$limit: 5}
        ])
     
        if(userDataDB.length === 0){
            return res.send({status:204, message: "No entry found" ,data: "userDataDB"});
        }
        return res.send({status:200 , message: "Read successfull" , data: userDataDB});
    }catch(error){
        return res.status(500).json({message:"Internal server error",error})
    }
})

// edit todo Api

app.post('/edit-todo',isAuth,async(req,res)=>{
    console.log(req.body)

    const {todoId ,newData}= req.body;
    const requestUserName = req.session.user.username;
    // todo data validation 
    try {
        await todoValidation({todoText: newData});
    } catch (error) {
        return res.send({status:400, message:error});
    }
    try{
        const todo = await todoModel.findOne({_id: todoId});
        
        if(!todo){
            return res.send({status: 400 ,message: `Entry not found by id:${todoId}`});
        }
        //check the ownership
        if(todo.username !== requestUserName){
            return res.send({status: 403, message: "Not allowed to update this entry"});
        }
        //edit the todo
        const userPrevData = await todoModel.findOneAndUpdate({_id:todoId},{ todoText: newData});
        
        return res.send({status:200 , message: "updated successfully" , data: userPrevData});
    }catch(error){
        return res.status(500).json({message:"Internal server error",error})
    }
    
})

//delete todo api
app.post("/delete-todo",isAuth,async(req,res)=>{
    const requestUserName = req.session.user.username;
    const todoId = req.body.todoId;

    //check the ownership
    try{
        const todo = await todoModel.findOne({_id: todoId});
        if(!todo){
            return res.send({status: 400 ,message: `Entry not found by id:${todoId}`});
        }
        if(requestUserName !== todo.username){
            return res.send({status: 403 ,message: "Not allowed to update this entry"});
        }
        //delete todo
        const userPrevData = await todoModel.findByIdAndDelete({_id:todoId});
        return res.send({status: 200 ,message: "updated successfully" , data: userPrevData});
    }catch(error){
        return res.send({status: 500 ,message:"Internal server error",error})
    }
})
app.listen(PORT,()=>{
    console.log(`http://localhost:${PORT}`)
})


 