import { createYoga, createSchema } from "graphql-yoga";
import { readFileSync } from "fs";
import { join } from "path";
import { resolvers, createContext } from "@/graphql/resolvers";

// Read schema file
let typeDefs: string;
try {
  typeDefs = readFileSync(
    join(process.cwd(), "graphql", "schema.graphql"),
    "utf-8"
  );
} catch {
  // Fallback for build time when file might not be accessible
  typeDefs = `
    type Query {
      _placeholder: String
    }
  `;
}

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: {
    Response,
    Request,
  },
  // Enable GraphiQL in development
  graphiql: process.env.NODE_ENV === "development",
  // CORS configuration
  cors: {
    origin: process.env.NEXTAUTH_URL || "*",
    credentials: true,
    methods: ["POST", "OPTIONS"],
  },
});

export const GET = yoga;
export const POST = yoga;
export const OPTIONS = yoga;
