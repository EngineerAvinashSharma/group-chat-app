import validators from 'validator';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import jwt from 'jsonwebtoken';
import Group from '../models/group';
import Message from '../models/message';
import mongoose from 'mongoose';
import { PubSub, withFilter } from 'graphql-subscriptions';

const pubsub = new PubSub();

module.exports = {
  createUser: async function ({ userInput }) {
    //   const email = args.userInput.email;
    let errors = [];
    if (!validators.isEmail(userInput.email)) {
      errors.push({ message: 'E-mail is Invalid' });
    }
    if (validators.isEmpty(userInput.password || validators.isLength(userInput.password, { min: 5 }))) {
      errors.push({ message: 'Password Too Short' });
    }
    if (errors.length > 0) {
      const err = new Error('Invalid Input');
      err.data = errors;
      err.code = 422;
      throw err;
    }
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  login: async function ({ email, password }) {
    const user = await User.findOne({ email: email });
    if (!user) {
      const err = new Error('User Not Found');
      err.code = 404;
      throw err;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const err = new Error('Password Incorrect');
      err.code = 401;
      throw err;
    }
    const token = jwt.sign({
      userId: user._id.toString(),
      email: user.email
    }, 'hereismysecretkey',
      { expiresIn: '1h' });
    return { token: token, userId: user._id.toString() };
  },
  // createGroup: async function ({ groupInput }) {
  //   const existingGroup = await Group.findOne({ name: groupInput.name });
  //   if (existingGroup) {
  //     const error = new Error('Group already exists!');
  //     throw error;
  //   }
  //   const group = new Group({
  //     name: groupInput.name
  //   });
  //   const createdGroup = await group.save();
  //   return { ...createdGroup._doc, _id: createdGroup._id.toString() }
  // },
  groups: async function ({ limit, page }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticated!");
      err.code = 401;
      throw err;
    }
    const totalGroups = await Group.find().countDocuments();
    const groups = await Group.find().limit(limit * 1).skip((page - 1) * limit).exec();
    if (groups < 0) {
      const error = new Error('Group already exists!');
      throw error;
    }
    return {
      groups: groups.map(g => {
        return { ...g._doc, name: g.name, _id: g._id.toString(), createdAt: g.createdAt.toISOString() }
      }),
      totalGroups: totalGroups
    };
  },
  joinGroup: async function ({ groupInput }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticated!");
      err.code = 401;
      throw err;
    }
    const group = await Group.findOne({ name: groupInput.name });
    if (!group) {
      const error = new Error('Group Not exists!');
      throw error;
    }
    const userExits = group.members.every(elem => elem.toString() === req.userId.toString());
    if (userExits) {
      const error = new Error('You Are Already in Group!');
      throw error;
    }
    const updatedGroup = await Group.findOneAndUpdate({ _id: group._id }, { $push: { members: req.userId } });
    if (!updatedGroup) {
      const error = new Error('Join Failed');
      throw error;
    }
    const UserAdded = await User.findOneAndUpdate({ _id: req.userId }, { $push: { groups: updatedGroup._id } });
    if (!UserAdded) {
      const error = new Error('Join Failed');
      throw error;
    }
    pubsub.publish("groupJoined", { userId: req.userId, groupId: updatedGroup._id.toString() });
    return { ...updatedGroup._doc, _id: updatedGroup._id.toString(), users: updatedGroup.members, messages: updatedGroup.messages };
  },
  sendMessage: async function ({ messageInput }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticated!");
      err.code = 401;
      throw err;
    }
    const group = await Group.findOne({ _id: mongoose.Types.ObjectId(messageInput.group) });
    if (!group) {
      const error = new Error('Join A Group');
      throw error;
    }
    const message = new Message({
      body: messageInput.body,
      sendBy: req.userId,
      groupId: group._id
    });
    const sentMessage = await message.save();
    const updatedGroup = await Group.updateOne({ _id: sentMessage.groupId }, { $push: { message: sentMessage._id } });
    const updateUser = await User.updateOne({ _id: sentMessage.sendBy }, { $push: { messages: sentMessage._id } });
    pubsub.publish("newMessage", {
      sendBy: req.userId,
      groupId: updatedGroup._id
    });
    return { ...sentMessage._doc, _id: sentMessage._id.toString(), body: sentMessage.body };
  },
  getMessages: async function ({ groupId }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticated!");
      err.code = 401;
      throw err;
    }
    const group = await Group.findOne({ _id: mongoose.Types.ObjectId(groupId) });

    return { messages: group.message, name: group.name };
  },
  messages: async function ({ id }) {
    const messages = Messages.find({ _id: id });
    return { messages }
  },
  deleteMessage: async function (_, { id }, req) {
    if (!req.isAuth) {
      const err = new Error("Not Authenticated!");
      err.code = 401;
      throw err;
    }
    const message = await Message.findOneAndDelete({ _id: mongoose.Types.ObjectId(id), sendBy: req.userId });
    pubsub.publish("messageDeleted", { messageId: message._id });
    return true;
  },
  userTyping: (_, { groupId }) => {
    pubsub.publish("userTyping", { userTyping: req.userId, groupId: groupId });
    return true;
  },
  newMessage: {
    subscribe: withFilter(
      () => pubsub.asyncIterator("newMessage"),
      (payload, variables) => {
        return payload.groupId === variables.groupId;
      }
    )
  },
  userTyping: {
    subscribe: withFilter(
      () => pubsub.asyncIterator("userTyping"),
      (payload, variables) => {
        return payload.groupId === variables.groupId;
      }
    )
  },
  groupJoined: {
    subscribe: withFilter(
      () => pubsub.asyncIterator("groupJoined"),
      (payload, variables) => {
        return payload.groupId === variables.groupId && payload.userId === variables.userId;
      }
    )
  },
  messageDeleted: {
    subscribe: withFilter(
      () => pubsub.asyncIterator("messageDeleted"),
      (payload, variables) => {
        return payload.messageId === variables.messageId;
      }
    )
  }
};
