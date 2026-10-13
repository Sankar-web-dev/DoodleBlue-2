import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DoodleBlue API",
      version: "1.0.0",
      description: "REST API documentation for the DoodleBlue server",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
          description: "Session cookie set after login",
        },
      },
    },
  },
  // Scan all route files for @openapi JSDoc comments
  apis: ["./src/modules/**/*.routes.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
