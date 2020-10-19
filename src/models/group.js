import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const groupSchema = new Schema(
  {
    name:{
      type: String,
      required: true
    },
    members: {
      type:[Schema.Types.ObjectId],
      ref:'User'
    },
    message: {
      type: [Schema.Types.ObjectId],
      ref:'Message'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
