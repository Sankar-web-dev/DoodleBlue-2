import swaggerJsdoc from "swagger-jsdoc";

const PORT = process.env.PORT || 5000;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "sms.sid";
const API_BASE = "/api/v1";

const servers = [
  {
    url: `http://localhost:${PORT}${API_BASE}`,
    description: "Development server",
  },
];

if (process.env.API_PUBLIC_URL) {
  servers.push({
    url: `${process.env.API_PUBLIC_URL}${API_BASE}`,
    description: "Production server",
  });
}

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DoodleBlue — Club & Event Management API",
      version: "1.0.0",
      description: [
        "REST API for the college club & event management system.",
        "",
        "**Authentication** — session-based. `POST /auth/login` sets an",
        `HttpOnly session cookie (\`${COOKIE_NAME}\`) that must be sent`,
        "with every subsequent request.",
        "",
        "**Authorization** — RBAC. Users carry a role with a",
        "resource/action permission matrix. `SUPER_ADMIN` bypasses all",
        "checks. Other roles need `create`/`read`/`update`/`delete` on the",
        "resource being accessed.",
        "",
        "**Envelope** — all responses are JSON:",
        "`{ success: true, data: … }` or `{ success: false, error: { message } }`.",
      ].join("\n"),
      contact: { name: "DoodleBlue" },
      license: { name: "ISC" },
    },
    servers,
    tags: [
      { name: "Auth", description: "Login, logout, session" },
      { name: "Roles", description: "Custom roles & permission matrices" },
      { name: "Users", description: "User management" },
      { name: "Clubs", description: "College clubs" },
      { name: "Club Memberships", description: "Club members & coordinators" },
      { name: "Events", description: "Club & general events" },
      { name: "Event Registrations", description: "Event sign-ups & approvals" },
      { name: "Attendance", description: "Event attendance marking" },
      { name: "Certificates", description: "Certificate requests & issuance" },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: COOKIE_NAME,
          description:
            "HttpOnly session cookie set by `POST /auth/login`. " +
            "Include it on every authenticated request.",
        },
      },
      schemas: {
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                message: { type: "string", example: "Not authorized" },
                code: { type: "string", example: "FORBIDDEN" },
              },
            },
          },
        },
        Permission: {
          type: "object",
          properties: {
            resource: {
              type: "string",
              enum: [
                "roles",
                "users",
                "clubs",
                "clubMemberships",
                "events",
                "eventRegistrations",
                "attendance",
                "certificates",
              ],
            },
            actions: {
              type: "array",
              items: {
                type: "string",
                enum: ["create", "read", "update", "delete"],
              },
            },
          },
        },
        Role: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Faculty Coordinator" },
            description: { type: "string" },
            isSystem: { type: "boolean", example: false },
            isActive: { type: "boolean", example: true },
            permissions: {
              type: "array",
              items: { $ref: "#/components/schemas/Permission" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Ada Lovelace" },
            email: { type: "string", format: "email" },
            role: { type: "string", example: "FACULTY" },
            isActive: { type: "boolean", example: true },
            profileImageUrl: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "No valid session",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        Forbidden: {
          description: "Missing permission for this resource/action",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        ValidationError: {
          description: "Request body failed validation",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
    },
    security: [{ sessionCookie: [] }],
  },
  // Scan all route files for @openapi JSDoc comments
  apis: ["./src/modules/**/*.routes.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
