const mongoose = require('mongoose');


const clientSchema = new mongoose.Schema({

    name: { type: String, required: true},
    since: { type: Date, required: true },


},{ timestamps: true })

module.exports = mongoose.model('Client', clientSchema, 'clients');