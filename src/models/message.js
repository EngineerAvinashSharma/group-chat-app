import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    body: {
        type: String,
        required: true
    },
    sendBy:{
        type: Schema.Types.ObjectId,
        required: true,
        ref:'User'
    },
    groupId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref:'Group'
    },

},
    { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
