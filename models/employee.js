const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    clicked: {
        type: Boolean,
        default: false
    },
    clickTimestamp: {
        type: Date,
        default: null
    }
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
