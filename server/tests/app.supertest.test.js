const request = require("supertest");
const app = require("../src/app");

describe("CyLink backend smoke tests", () => {
  test("GET /health returns healthy status payload", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("CyLink backend is healthy.");
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });

  test("GET unknown route returns 404 via notFound middleware", async () => {
    const response = await request(app).get("/this-route-does-not-exist");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "Route not found: GET /this-route-does-not-exist"
    );
  });

  test("GET /app/profile redirects unauthenticated users to /auth", async () => {
    const response = await request(app).get("/app/profile");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/auth?next=%2Fapp%2Fprofile");
  });
});
