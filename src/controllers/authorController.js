const AuthorModel = require('../models/authorModel')
const jwt = require('jsonwebtoken')

function isValid(value){
    if(typeof(value) == undefined || typeof(value) == null) return false
    if(typeof(value) == String && value.trim().length == 0) return false
    return true
}

const createAuthor = async function (req, res){
    try{
        let authorDataFromBody = req.body
        let title = ["Mr", "Mrs", "Miss"]

        //Validation of all edge cases
        if(Object.keys(authorDataFromBody).length === 0) return res.status(400).send({Status: false, msg: 'Please provide author details in body'})
        
        if(!authorDataFromBody.fname) return res.status(400).send({Status: false, msg: 'First name is required'})
        if(!authorDataFromBody.lname) return res.status(400).send({Status: false, msg: 'Last name is required'})
        if(!authorDataFromBody.title) return res.status(400).send({Status: false, msg: 'Title is required'})
        if(!authorDataFromBody.email) return res.status(400).send({Status: false, msg: 'Email is required'})
        if(!authorDataFromBody.password) return res.status(400).send({Status: false, msg: 'Password is required'})
        
        if(title.includes(authorDataFromBody.title) == false) return res.status(400).send({Status: false, msg: `Please provide valid title from ${title}`})
        
        if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(authorDataFromBody.email)) return res.status(400).send({Status: false, msg: 'Please provide valid email id'})
        
        // validation id email id already exist
        let emailAlreadyExist = await AuthorModel.findOne({email: authorDataFromBody.email})
        
        if(emailAlreadyExist) return res.status(400).send({Status: false, msg: 'Email already exist'})
        
        let newAuthor = await AuthorModel.create(authorDataFromBody)
        res.status(201).send({status: true, msg: 'New author created', data: newAuthor})

    }catch(error){
        res.status(500).send({error: error.message})
    }
} 


const login = async function (req, res){
    try{
        let loginDetails = req.body
        let userName = loginDetails.email
        let pass = loginDetails.password

        if(Object.keys(loginDetails).length === 0) return res.status(400).send({Status: false, msg: 'Please provide usename and password in body'})

        if(!isValid(userName)) return res.status(400).send({Status: false, msg: 'Email is required'})
        if(!isValid(pass)) return res.status(400).send({Status: false, msg: 'Password is required'})
        
        if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userName)) return res.status(400).send({Status: false, msg: 'Please provide valid email id'})

        let author = await AuthorModel.findOne({email: userName, password: pass})

        if(!author) return res.status(400).send({Status: false, msg: 'Invalid login credentials'})

        let payLoad = {authorId : author._id, iat :Math.floor(Date.now() / 1000), exp : Math.floor(Date.now() / 1000) + 10*60*60}
        let secretKey = "myprivatekeycontains123!@#"
        let token = jwt.sign (payLoad, secretKey )

        res.header("x-api-key", token)
        res.status(200).send({status: true, msg: 'Login successful', data: token})

    }catch (error) {
        res.status(500).send({ error: error.message })
    }
}
module.exports.createAuthor = createAuthor
module.exports.login = login