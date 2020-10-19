import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    body: {
        type: String,
        required: true
    },
    sendBy:{
        type: Schema.Types.ObjectId,
        required: true
    },
    groupId: {
        type: Schema.Types.ObjectId,
        required: true
    },

},
    { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
