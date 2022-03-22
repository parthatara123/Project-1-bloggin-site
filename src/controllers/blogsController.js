const BlogsModel = require('../models/blogsModel')
const AuthorModel = require('../models/authorModel')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

// for validation of blog schema 
function isValid(value){
    if(typeof(value) === 'undefined' || typeof(value) === null) return false
    if(typeof(value) == String && values.trim().length === 0) return false
    return true
}

// for validation of req.body
function isValidRequestBody(requestBody){
    return Object.keys(requestBody).length > 0
}

// for validation of authorId
function isValidObjectId(authorId){
    return mongoose.Types.ObjectId.isValid(authorId)
}

// handler to create new blogs after author login
const createBlogs = async function (req, res) {
    try {
        let blogData = req.body
        let jwtToken = req.headers['x-api-key']
        let secretKey = "myprivatekeycontains123!@#"
    

        // various validation for edge cases
        if(!isValidRequestBody(blogData)) return res.status(400).send({ status: false, msg: "Please provide input" })
        if(!isValid(blogData.title)) return res.status(400).send({ status: false, msg: "Title is required" })
        if(!isValid(blogData.body)) return res.status(400).send({ status: false, msg: "Blog Body is required" })
        if(!isValid(blogData.tags)) return res.status(400).send({ status: false, msg: "Tags is required" })
        if(!isValidObjectId(blogData.authorId)) return res.status(400).send({ status: false, msg: "AuthorId is required" })
        if(!isValid(blogData.category)) return res.status(400).send({ status: false, msg: "Category is required" })
        if(!isValid(blogData.subcategory)) return res.status(400).send({ status: false, msg: "Sub category is required" })
        
        // mark published date and time while publishing
        if(blogData.isPublished == true){
            req.body.publishedAt == Date.now()
        }

        let author = await AuthorModel.findById(blogData.authorId)
        
        // check if given author id is exists in DB or not
        if (!author) return res.status(404).send({ status: false, msg: "Please provide valid author ID" })
        // if available, then create new blog by that author
        
        // authorization of author by authorId given in blog
        let verifiedToken = jwt.verify(jwtToken, secretKey)

        if(verifiedToken.authorId != blogData.authorId) return res.status(403).send({status: false, msg: 'Unauthorized access'})
        let blog = await BlogsModel.create(blogData)

        res.status(201).send({ status: true, msg: 'Blog created successfully', data: blog })

    } catch (error) {
        res.status(500).send({ error: error.message })
    }
}


const getFilteredBlogs = async function (req, res) {
    try {
        let input = req.query

        //* below methods for converting inputData to array of objects
        let filters = Object.entries(input)
        console.log(filters)
        let filtersAsObject = []

        for (let i = 0; i < filters.length; i++) {
            let element = filters[i]
            let obj = {}
            obj[element[0]] = element[1]
            filtersAsObject.push(obj)
        }

        //* conditions are given in project documents and finalFilters will have both conditions & filters.

        let conditions = [{ isDeleted: false }, { isPublished: true }, {deletedAt: null}]
        let finalFilters = conditions.concat(filtersAsObject)

        //* handled two cases: (1) where client is using the filters (2) where client want to access all published data

        if (isValidRequestBody(input)) {
            if(Object.values.includes('undefined') || Object.values.includes(null) || Object.values.includes("")){
                res.status(400).send({status: false, msg: 'Please provide valid filters'})
            }
            let blogs = await BlogsModel.find({ $and: finalFilters })

            if (Array.isArray(blogs) && blogs.length == 0) return res.status(404).send({ status: false, msg: "no blogs found" })

            res.status(200).send({ status: true, totalDocuments:blogs.length, data: blogs })

        }
        
    }
    catch (error) {
        res.status(500).send({ error: error.message })
    }
}

const updateBlog = async function (req, res) {
    try {

    let inputData = req.body
    let newTitle = req.body.title
    let newBody = req.body.body
    let newTag = req.body.tags
    let newSubCategory = req.body.subcategory
    let id = req.params["blogId"]
    
        if (Object.keys(inputData).length == 0) return res.status(400).send({ status: false, msg: "please provide input data" })
        
        if(!isValidObjectId(id)) return res.status(400).send({ status: false, msg: `${id} is not valid object Id`})
        
        let blog = await BlogsModel.findOne({_id: id, isDeleted: false, deletedAt: null})
        if(!blog) return res.status(400).send({ status: false, msg: "No blog found" })
        
        if(Object.values(inputData).includes('undefined') || Object.values(inputData).includes(null) || Object.values(inputData).includes("")){
            return res.status(400).send({status: false, msg: "Please provide valid input data"})
        }

        // if clint gives update data like tags or subcategory as string, converting it into array
        if(typeof(newTag) == String) { 
            newTag = [newTag]
        }
        
        if(typeof(newSubcategory) == String) { 
            newSubCategory = [newSubCategory]
        }
        
        if(newTag && newSubCategory){
            let updatedBlog = await BlogsModel.findByIdAndUpdate(
                { _id: id },
                {
                    $set: { title: newTitle, body: newBody, isPublished: true, publishedAt: Date.now() },
                    $addToSet: { tags: { $each : newTag}, subcategory: {$each : newSubCategory} }
                },
                { new: true })
            res.status(200).send({Status: true, msg: "Blog updated successfully", data: updatedBlog})
        } 
        else if(!newTag && !newSubCategory){
            let updatedBlog = await BlogsModel.findByIdAndUpdate(
                { _id: id },
                {
                    $set: { title: newTitle, body: newBody, isPublished: true, publishedAt: Date.now() }
                   
                },
                { new: true })
            res.status(200).send({Status: true, msg: "Blog updated successfully", data: updatedBlog})
        } 
        else if(!newTag && newSubCategory){
            let updatedBlog = await BlogsModel.findByIdAndUpdate(
                { _id: id },
                {
                    $set: { title: newTitle, body: newBody, isPublished: true, publishedAt: Date.now() },
                    $addToSet: {  subcategory: {$each : newSubCategory} }
                },
                { new: true })
            res.status(200).send({Status: true, msg: "Blog updated successfully", data: updatedBlog})
        } 
        else if(newTag && !newSubCategory){
            let updatedBlog = await BlogsModel.findByIdAndUpdate(
                { _id: id },
                {
                    $set: { title: newTitle, body: newBody, isPublished: true, publishedAt: Date.now() },
                    $addToSet: { tags: { $each : newTag}  }
                },
                { new: true })
            res.status(200).send({Status: true, msg: "Blog updated successfully", data: updatedBlog})
        } 

    } catch (error) {
        console.log(error.message)
    }
}

const deleteBlog = async function (req, res) {
    try {
        let id = req.params.blogId
        
        if(!isValidObjectId(id)) return res.status(400).send({status: false, msg: "Invalid blogid"})
        
        let blog = await BlogsModel.findOne({_id: id, isDeleted: false, deletedAt: null})

        if(!blog) return res.status(404).send({status: false, msg: "No such blog found"})
        
        let markDirty = await BlogsModel.findByIdAndUpdate({ _id: id }, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })

        res.status(200).send({status: true, msg: "Blog deleted successfully"})

    } catch (error) {
        res.status(500).send({ error: error.message })
    }
}

const deleteFilteredBlog = async function (req, res) {
    try {
        let input = req.query
        let inputArray = Object.entries(input)
        let emptyInput = inputArray.filter(ele => ele[1] == "")

        if(emptyInput.length != 0) return res.status(400).send({status: false, msg: "property could not be blank"})
           
        if (Object.keys(input).length == 0)  return res.status(400).send({ status: false, msg: "please provide input data" })  

        let deletedBlog = await BlogsModel.updateMany({ $and: [input, { isDeleted: false }, { isPublished : false}] }, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })
        
        if(deletedBlog.modifiedCount == 0) return res.status(404).send({ status: false, msg: "No such document exist" })
        res.status(200).send()
    } catch (error) {
        res.status(500).send({ error: error.message })
    }
}


module.exports.createBlogs = createBlogs
module.exports.getFilteredBlogs = getFilteredBlogs
module.exports.updateBlog = updateBlog
module.exports.deleteBlog = deleteBlog
module.exports.deleteFilteredBlog = deleteFilteredBlog

