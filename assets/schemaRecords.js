import joi from 'joi'

const schemaRecords = joi.object({
    value: joi.number().required(),
    description: joi.string().max(30).required()
})

export default schemaRecords;