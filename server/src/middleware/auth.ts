import { Context, Next } from "https://deno.land/x/hono@v3.12.9/mod.ts";
import { verify } from "https://deno.land/x/djwt@v2.2/mod.ts";
import { User } from "../models/User.ts";

export const auth = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verify(token, Deno.env.get("JWT_SECRET")!, "HS256");
    const user = await User.findById(payload.id as string).select("-password");

    if (!user) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    c.set("user", user);
    await next();
  } catch (error) {
    return c.json({ message: "Unauthorized", error: error.message }, 401);
  }
};

export const admin = async (c: Context, next: Next) => {
  const user = c.get("user");

  if (user.role !== "admin") {
    return c.json({ message: "Forbidden" }, 403);
  }

  await next();
};
