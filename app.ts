import { Hono } from "hono";
import { type Serve } from "bun";
const n2fa = require("node-2fa");

const app = new Hono();
app.get("/", (ctx) =>
  ctx.json({ error: false, message: "welcome to the hws 2fa server. go away." })
);
app.post("/v1/gen", async (ctx) => {
  const { account, service } = await ctx.req.parseBody();

  const secret = n2fa.generateSecret({
    name: service,
    account,
  });

  return ctx.json(secret);
});

app.post("/v1/verify", async (ctx) => {
  const { token, totp } = await ctx.req.parseBody();
  if (!token || !totp)
    return ctx.json({ error: true, message: "INVALID_REQUEST" }, 400);
  const check = n2fa.verifyToken(token, totp);
  if (!check) return ctx.json({ error: true, message: "AUTH_FAILED" }, 400);
  if (check.delta > 0) return ctx.json({ error: true, message: "EARLY" }, 400);
  if (check.delta < 0) return ctx.json({ error: true, message: "LATE" }, 400);
  return ctx.json({ error: false, message: "SUCCESS" }, 200);
});

console.log("mini2fa server started @ http://localhost:8789");

export default {
  port: 8789,
  fetch: app.fetch,
} as Serve;
