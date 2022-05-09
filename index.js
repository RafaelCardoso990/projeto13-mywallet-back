import express, {json} from 'express'
import { MongoClient } from 'mongodb'
import cors from 'cors'
import dotenv from 'dotenv'
import schemaSignUp from './assets/schemaSignUp.js'
import schemaSignIn from './assets/schemaSignIn.js'
import schemaRecords from './assets/schemaRecords.js'
import bcrypt from 'bcrypt'
import {v4} from 'uuid'
import dayjs from 'dayjs'


dotenv.config()

const app = express()
app.use(json())
app.use(cors())

const mongoClient = new MongoClient(process.env.URL)
let database;

app.post('/sign-in', async (req, res) =>{
    const {email} = req.body
    const login = req.body

    const {error} = schemaSignIn.validate(login, {abortEarly: false})

    if(error){
        res.status(422).send(error.details.map(detail => detail.message));
        return
    }

    try {
        await mongoClient.connect()
        database = mongoClient.db(process.env.BANC)
        
        const user = await database.collection("users").findOne({email: login.email})
        
        if(user && bcrypt.compareSync(login.password, user.password)){
            const token = v4()

            await database.collection("sessions").insertOne({
                token,
                userID: user._id
            })

            res.send({token, email})

        }else res.sendStatus(404);
        
    } catch(e){
        res.sendStatus(500)
        console.log("Usuario não encontrado.")
    }
    
})

app.get('/records', async (req, res) => {
    const {authorization} = req.headers
    const token = authorization?.replace("Bearer", "").trim();
   
    
    if(!token){       
        return res.sendStatus(401)
    } 
   

    const session = await database.collection("sessions").findOne({token})

    if(!session){        
        return res.sendStatus(401)
    } 

    const user = await database.collection("users").findOne({_id: session.userID})
    
   
    if(!user){
        return res.sendStatus(404)
    }

    delete user.password
   

    res.send(user)

})    


app.get('/transactions', async (req, res) => {
    
    const {authorization, email} = req.headers
    const token = authorization?.replace("Bearer", "").trim();
   
    
    if(!token){       
        return res.sendStatus(401)
    } 
   
    const record = await database.collection("records").find({email: email}).toArray()
       
    if(!record){
        console.log("não achei")
        return res.sendStatus(404)
    }  
   
    res.send(record).status(201)

})    

app.post('/sign-up', async (req, res) =>{
    const {name, email, password} = req.body
    const cadastro = req.body
    
    const {error} = schemaSignUp.validate(cadastro, {abortEarly: false})
    
    if(error){
        res.status(422).send(error.details.map(detail => detail.message));
        return
    }

    
    try{
        const passwordCrypt = bcrypt.hashSync(password, 10)
        await mongoClient.connect()
        database = mongoClient.db(process.env.BANC)
        
        const checkEmail = await database.collection("users").findOne({email})
       
    
        if(checkEmail){
            return res.sendStatus(409).send("E-mail ja cadastrado")
        }

        await database.collection("users").insertOne({name, email, password: passwordCrypt})
        res.sendStatus(201)
    } catch(e) {
        res.sendStatus(500)
    }    
})

app.post('/entry', async (req, res) => {    
    const {value, description, email} = req.body


    try{

        await mongoClient.connect()
        database = mongoClient.db(process.env.BANC)

        await database.collection("records").insertOne({value, description, is: "entry", email, time: dayjs().format("DD/MM")})
        res.sendStatus(201)
    } catch(e){
        res.sendStatus(500)
    }
})

app.get('/cache', async (req, res) =>{
    const {authorization, email} = req.headers
    const token = authorization?.replace("Bearer", "").trim();

    try{

        await mongoClient.connect()
        database = mongoClient.db(process.env.BANC)

        const records = await database.collection("records").find({email: email}).toArray()
        console.log("achei",records)

        let cache = 0;
        records.forEach(record => {
            if (record.is === "entry") cache += parseInt(record.value);
            else if (record.is === "exit") cache -= parseInt(record.value);
        });
        console.log(cache)
        return res.status(200).send(`${cache}`)
    } catch(e){
        res.sendStatus(500)
    }
})

app.post('/exit', async (req, res) => {    
    const {value, description, email} = req.body
    
    try{

        await mongoClient.connect()
        database = mongoClient.db(process.env.BANC)

        await database.collection("records").insertOne({value, description, is: "exit", email, time: dayjs().format("DD/MM")})
        res.sendStatus(201)
    } catch(e){
        res.sendStatus(500)
    }
})

app.listen(process.env.PORT, () => {
    console.log(`Server listening on ${process.env.PORT}`)
})
