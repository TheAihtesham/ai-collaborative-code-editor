const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        unique: true
    },
    code: {
        type: String,
        default: ''
    }
})

module.exports = mongoose.model('Room', roomSchema);