import { buildSchema } from 'graphql';

module.exports = buildSchema(`
    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
    }
    type Group {
        _id:ID!
        name:String!
        member:[User]
        message:[Message]
    }
    type UserData{
        name:String
        email: String
    }
    type Message{
        _id: ID!
        body:String!
        sendBy:UserData!
        groupId:Group!
    }
    type GroupData{
        groups:[Group!]
        totalGroups:Int!
        messages:MessageData!
    }
    type MessageData{
        messages:[Message!]
        totalMessages:Int!
        sendBy:UserData!
        body:String!
    }
    type AuthData {
        userId:ID!
        token:String!
    }
    input UserInputData {
        email: String!
        name: String!
        password: String!
    }
    input GroupInputData {
        name: String!
    }
    input MessageInputData{
        body:String!
        group:String!
    }

    type RootQuery {
        login(email:String!, password:String!): AuthData!,
        groups(limit:Int!,page:Int!):GroupData!
        group(id: ID!):Group!
        getMessages(groupId:ID!):Group!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createGroup(groupInput: GroupInputData): Group!
        joinGroup(groupInput: GroupInputData): Group!
        sendMessage(messageInput:MessageInputData):Message!
        deleteMessage(id:String!,groupId: String!):Boolean!
        userTyping(sendby: String!, groupId: String!): Boolean!
    }
    type RootSubscription{
          newMessage: Message!
          userTyping:String!
          groupJoined:Group!
          messageDeleted:Boolean!
    }
    schema {
        query: RootQuery
        mutation: RootMutation
        subscription: RootSubscription
    }
`);
