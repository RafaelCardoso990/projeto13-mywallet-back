import express, {json} from 'express'
import { MongoClient } from 'mongodb'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(json())
app.use(cors())

const mongoClient = new MongoClient(process.env.URL)
let database;

app.post('/sign-in', async (req, res) =>{
    console.log(req.body)
})

app.listen(process.env.PORT, () => {
    console.log(`Server listening on ${process.env.PORT}`)
})
