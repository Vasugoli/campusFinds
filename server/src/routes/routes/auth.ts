import { Hono } from "https://deno.land/x/hono@v3.12.9/mod.ts";
import { User } from "../../models/User.ts";
import { sign } from "https://deno.land/x/djwt@v2.2/mod.ts";
import { auth } from "../../middleware/auth.ts";
import { zValidator } from '@hono/zod-validator';
import { z } from 'https://deno.land/x/zod/mod.ts';

const authRoutes = new Hono();

const registerSchema = z.object({
  displayName: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  rollNo: z.string(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
authRoutes.post("/register", zValidator('json', registerSchema), async (c) => {
  const { displayName, email, password, rollNo } = c.req.valid("json");

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return c.json({ message: "User already exists" }, 400);
  }

  const user = new User({ displayName, email, password, rollNo });
  await user.save();

  const token = await sign({ id: user._id }, Deno.env.get("JWT_SECRET")!, "HS256");

  return c.json({ token });
});

// Login
authRoutes.post("/login", zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const user = await User.findOne({ email });
  if (!user) {
    return c.json({ message: "Invalid credentials" }, 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return c.json({ message: "Invalid credentials" }, 401);
  }

  const token = await sign({ id: user._id }, Deno.env.get("JWT_SECRET")!, "HS256");

  return c.json({ token });
});

// Get Me
authRoutes.get("/me", auth, (c) => {
  const user = c.get("user");
  return c.json(user);
});

export default authRoutes;
