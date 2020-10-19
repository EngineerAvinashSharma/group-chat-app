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
    type Message{
        _id: ID!
        body:String!
        sendBy:User!
        groupId:Group!
    }
    type GroupData{
        groups:[Group!]
        totalGroups:Int!
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
        groups(limit:Int!,page:Int!):[Group]
        getMessages(groupId:ID!):Group!
        messages:[Message]
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        createGroup(groupInput: GroupInputData): Group!
        joinGroup(groupInput: GroupInputData): Group!
        sendMessage(messageInput:MessageInputData):Message!
        deleteMessage(id:String!):Boolean!
        userTyping(sendby: String!, groupId: String!): Boolean!
    }
    type RootSubscription{
          newMessage(sendBy:ID!): Message!
          userTyping (GroupId: ID!):String!
          groupJoined(userId:ID!):Group!
          messageDeleted(id: ID!):Boolean!
    }
    schema {
        query: RootQuery
        mutation: RootMutation
        subscription: RootSubscription
    }
`);
