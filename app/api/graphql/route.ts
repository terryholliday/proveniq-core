import { createYoga, createSchema } from "graphql-yoga";
import { readFileSync } from "fs";
import { join } from "path";
import { resolvers, createContext } from "@/graphql/resolvers";
import { NextRequest } from "next/server";

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

// Wrap yoga handlers for Next.js 15 compatibility
export async function GET(request: NextRequest) {
  return yoga.handle(request);
}

export async function POST(request: NextRequest) {
  return yoga.handle(request);
}

export async function OPTIONS(request: NextRequest) {
  return yoga.handle(request);
}
