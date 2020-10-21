import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  groups:[{
    type:[Schema.Types.ObjectId],
    ref:'Group'
  }],
  messages:[{
    type:[Schema.Types.ObjectId],
    ref:'Message'
  }]
},
  { timestamps: true });
module.exports = mongoose.model('User', userSchema);
