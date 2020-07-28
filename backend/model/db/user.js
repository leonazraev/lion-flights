const mongoos = require('mongoose');
const Schema = mongoos.Schema;

const userSchema = new Schema({
    email:{
        type: String,
        required: true

    },
    password: {
        type: String,
        required: true
    },
    myFlights: [{
        type: Schema.Types.ObjectId,
        ref: 'Flight'
    }],
    resetToken: String,
    resetExpireToken: Date,
})
module.exports = mongoos.model('User',userSchema);