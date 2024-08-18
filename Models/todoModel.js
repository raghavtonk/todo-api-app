const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const todoSchema = new Schema({
    todoText: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 80,
        trim: true
    },
    username:{
        type: String,
        required: true
    },
});
const todoModel = mongoose.model("todolist",todoSchema);
module.exports = {todoModel};