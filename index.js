import express, {json} from 'express'
import { MongoClient } from 'mongodb'
import cors from 'cors'
import dotenv from 'dotenv'
import schemaSignUp from './assets/schemaSignUp.js'
import schemaSignIn from './assets/schemaSignIn.js'
import bcrypt from 'bcrypt'

dotenv.config()

const app = express()
app.use(json())
app.use(cors())

const mongoClient = new MongoClient(process.env.URL)
let database;

app.post('/sign-in', async (req, res) =>{
    const {email, password} = req.body
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
        
        console.log(user)

        if(user && bcrypt.compareSync(login.password, user.password)){
            res.send(user)
        }else res.sendStatus(404);
        
    } catch(e){
        res.sendStatus(500)
        console.log("Usuario não encontrado.")
    }
    
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
        console.log(checkEmail)
    
        if(checkEmail){
            return res.sendStatus(409).send("E-mail ja cadastrado")
        }

        await database.collection("users").insertOne({name, email, password: passwordCrypt})
        res.sendStatus(201)
    } catch(e) {
        res.sendStatus(500)
    }    
})


app.listen(process.env.PORT, () => {
    console.log(`Server listening on ${process.env.PORT}`)
})
