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
            image: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuthUser: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", example: "SUPER_ADMIN" },
            roleId: { type: "string", nullable: true },
            image: { type: "string", nullable: true },
            mustChangePassword: { type: "boolean", example: false },
            isActive: { type: "boolean", example: true },
            permissions: {
              type: "array",
              items: { $ref: "#/components/schemas/Permission" },
            },
          },
        },
        UserOption: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string" },
            isActive: { type: "boolean" },
          },
        },
        Meta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 50 },
            total: { type: "integer", example: 42 },
            totalPages: { type: "integer", example: 1 },
          },
        },
        Club: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Coding Club" },
            description: { type: "string" },
            department: { type: "string", example: "Computer Science" },
            logoUrl: { type: "string", nullable: true },
            facultyCoordinatorId: { type: "string" },
            facultyCoordinator: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                email: { type: "string" },
              },
            },
            isActive: {
              type: "boolean",
              description: "False until a SUPER_ADMIN approves the club",
              example: false,
            },
            createdBy: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ClubMembership: {
          type: "object",
          properties: {
            id: { type: "string" },
            clubId: { type: "string" },
            club: { $ref: "#/components/schemas/Club", nullable: true },
            studentId: { type: "string" },
            student: { $ref: "#/components/schemas/User", nullable: true },
            membershipRole: {
              type: "string",
              enum: ["MEMBER", "COORDINATOR"],
              description:
                "Club-scoped responsibility — separate from the global RBAC role",
            },
            status: {
              type: "string",
              enum: ["PENDING", "ACTIVE", "INACTIVE"],
              description:
                "Starts PENDING — a SUPER_ADMIN approves it to ACTIVE",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Event: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string", example: "Hackathon 2026" },
            description: { type: "string" },
            eventType: {
              type: "string",
              enum: ["GENERAL", "CLUB"],
              description:
                "GENERAL events are visible to everyone; CLUB events only to ACTIVE club members",
            },
            clubId: {
              type: "string",
              nullable: true,
              description: "Required when eventType is CLUB",
            },
            club: { $ref: "#/components/schemas/Club", nullable: true },
            venue: { type: "string", example: "Main Auditorium" },
            imageUrl: { type: "string", nullable: true },
            startAt: { type: "string", format: "date-time" },
            endAt: { type: "string", format: "date-time" },
            registrationDeadline: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            capacity: { type: "integer", nullable: true },
            status: {
              type: "string",
              enum: [
                "DRAFT",
                "PENDING",
                "APPROVED",
                "REJECTED",
                "PUBLISHED",
                "CANCELLED",
              ],
            },
            rejectionReason: { type: "string", nullable: true },
            createdBy: { type: "string" },
            approvedBy: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        EventRegistration: {
          type: "object",
          properties: {
            id: { type: "string" },
            eventId: { type: "string" },
            event: { $ref: "#/components/schemas/Event", nullable: true },
            studentId: { type: "string" },
            student: { $ref: "#/components/schemas/User", nullable: true },
            status: {
              type: "string",
              enum: [
                "REGISTERED",
                "PENDING",
                "APPROVED",
                "REJECTED",
                "CANCELLED",
              ],
              description:
                "GENERAL events start REGISTERED; CLUB events start PENDING and need coordinator approval",
            },
            rejectionReason: { type: "string", nullable: true },
            reviewedBy: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AttendanceRecord: {
          type: "object",
          properties: {
            id: { type: "string" },
            eventId: { type: "string" },
            event: { $ref: "#/components/schemas/Event", nullable: true },
            studentId: { type: "string" },
            student: { $ref: "#/components/schemas/User", nullable: true },
            status: { type: "string", enum: ["PRESENT", "ABSENT"] },
            markedBy: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                name: { type: "string" },
              },
            },
            markedAt: { type: "string", format: "date-time" },
          },
        },
        Certificate: {
          type: "object",
          properties: {
            id: { type: "string" },
            eventId: { type: "string" },
            event: { $ref: "#/components/schemas/Event", nullable: true },
            studentId: { type: "string" },
            student: { $ref: "#/components/schemas/User", nullable: true },
            status: {
              type: "string",
              enum: ["PENDING", "APPROVED", "REJECTED", "ISSUED"],
            },
            requestedBy: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                name: { type: "string" },
              },
            },
            reviewedBy: { type: "string", nullable: true },
            rejectionReason: { type: "string", nullable: true },
            certificateUrl: { type: "string", nullable: true },
            issuedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
      parameters: {
        ObjectIdPath: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
          description: "MongoDB ObjectId",
        },
        PageQuery: {
          in: "query",
          name: "page",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        LimitQuery: {
          in: "query",
          name: "limit",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
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
  // Scan route files for @openapi JSDoc — covers both tsx dev (src) and
  // compiled production builds (dist).
  apis: [
    "./src/modules/**/*.routes.ts",
    "./src/app.ts",
    "./dist/modules/**/*.routes.js",
    "./dist/app.js",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
