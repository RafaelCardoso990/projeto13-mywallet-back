import joi from 'joi'

const schemaSignIn = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required() 
})

export default schemaSignIn;