import { Hono } from "hono";
import { auth } from "../middleware/auth.ts";
import { createClaim, getMyClaims, getReceivedClaims, respondToClaim, getClaim } from "../controllers/claims_controllers.ts";

const claimRoutes = new Hono();

// Create a claim
claimRoutes.post("/", auth, createClaim);

// Get user's claims (as claimant)
claimRoutes.get("/my-claims", auth, getMyClaims);

// Get claims for user's items (as reporter)
claimRoutes.get("/received", auth, getReceivedClaims);

// Respond to a claim
claimRoutes.put("/:id/respond", auth, respondToClaim);

// Get a specific claim
claimRoutes.get("/:id", auth, getClaim);

export default claimRoutes;
