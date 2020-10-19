import { createServer } from 'http';
import expressGraphQL from 'express-graphql';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import express from 'express';
import * as bodyParser from 'body-parser-graphql'
import mongoose from 'mongoose';
import graphqlSchema from './graphql/schema';
import graphqlResolver from './graphql/resolvers';
import auth from './middleware/auth';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import expressPlayground from 'graphql-playground-middleware-express';


const app = express();
const subscriptionEndpoint = `ws://localhost:${process.env.PORT}/subscriptions`;

app.use(bodyParser.graphql());
app.use(auth);

app.use(
  '/graphql', expressGraphQL({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    subscriptionEndpoint,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || 'An Error Occured';
      const code = err.originalError.code || 500;
      return { message: message, status: code, data: data };
    }
  }),
);

app.get('/playground', expressPlayground({
  endpoint: "/graphql"
}));


//DataBase Connetion
mongoose
  .connect(
    process.env.MONGO_URI,
    { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false }
  )
  .then(result => {

    console.log('DB Connected');
  })
  .catch(err => console.log(err));


const webServer = createServer(app);

//Listening Server On Port
webServer.listen(process.env.PORT, () => {
  // Subscriptions handling:
  new SubscriptionServer({
    execute,
    subscribe,
    schema: graphqlSchema
  }, {
    server: webServer,
    path: '/subscriptions',
  });
  console.log(`Running a GraphQL API server at http://localhost:${process.env.PORT}/graphql`);
});