import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { Getmedia } from './mainCatalog.js';
import { MongoClient } from 'mongodb';
import { Zagonka } from './zagonka.js';

const client = new MongoClient('mongodb://localhost:27017/freeKino');
client.connect();

const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type Media {
    name: String!
    img: String!
    link: String!
    year: Int!
  }

  type Query {
    getmedia(group: Int!): [Media]
    refresh(group: Int!): [Media]
  }
`;

const resolvers = {
  Query: {
    getmedia(_, { group })
    {
      let e = new Getmedia(group, false);
      return e.init();
    },
    refresh(_, { group })
    {
      let e = new Getmedia(group, true);
      return e.init();
    },
  },
};


const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    zagonka: new Zagonka(client.db("freeKino").collection("zagonka")),
  }),
  plugins: [
    {
      async serverWillStart()
      {
        new Zagonka(client.db("freeKino").collection("zagonka")).ZagonkaInit();
      }
    }
  ]
});


const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);