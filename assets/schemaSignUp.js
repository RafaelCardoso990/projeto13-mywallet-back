import joi from 'joi'

const schemaSignUp = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    checkPassword: joi.ref('password')
})

export default schemaSignUp;