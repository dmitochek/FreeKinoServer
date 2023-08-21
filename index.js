import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { Getmedia } from './mainCatalog.js';

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
  }
`;

const resolvers = {
  Query: {
    getmedia(_, { group })
    {
      let e = new Getmedia(group);
      return e.init();
    }
  },
};


const server = new ApolloServer({
  typeDefs,
  resolvers,
});


const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);