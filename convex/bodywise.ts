import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const profileFields = {
  clientId: v.string(),
  goal: v.string(),
  age: v.string(),
  sex: v.string(),
  level: v.string(),
  targetMinutes: v.number(),
  quiet: v.boolean(),
};

export const health = query({
  args: {},
  returns: v.object({
    connected: v.boolean(),
    app: v.string(),
    purpose: v.string(),
  }),
  handler: async () => ({
    connected: true,
    app: "Bodywise",
    purpose: "Preview backend for profiles, sessions and premium progress.",
  }),
});

export const getProfile = query({
  args: { clientId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      goal: v.string(),
      age: v.string(),
      sex: v.string(),
      level: v.string(),
      targetMinutes: v.number(),
      quiet: v.boolean(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .first();
    if (!profile) return null;
    return {
      goal: profile.goal,
      age: profile.age,
      sex: profile.sex,
      level: profile.level,
      targetMinutes: profile.targetMinutes,
      quiet: profile.quiet,
      updatedAt: profile.updatedAt,
    };
  },
});

export const upsertProfile = mutation({
  args: profileFields,
  returns: v.object({ saved: v.boolean(), updatedAt: v.number() }),
  handler: async (ctx, args) => {
    const updatedAt = Date.now();
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt });
    } else {
      await ctx.db.insert("profiles", { ...args, updatedAt });
    }
    return { saved: true, updatedAt };
  },
});

export const logSession = mutation({
  args: {
    clientId: v.string(),
    goal: v.string(),
    identity: v.string(),
    readiness: v.string(),
    minutes: v.number(),
    moves: v.array(v.string()),
    feel: v.optional(v.union(v.literal("Too easy"), v.literal("Just right"), v.literal("Too hard"))),
  },
  returns: v.object({ saved: v.boolean(), completedAt: v.number() }),
  handler: async (ctx, args) => {
    const completedAt = Date.now();
    await ctx.db.insert("sessions", { ...args, completedAt });
    return { saved: true, completedAt };
  },
});

export const recentSessions = query({
  args: { clientId: v.string(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      goal: v.string(),
      identity: v.string(),
      readiness: v.string(),
      minutes: v.number(),
      moves: v.array(v.string()),
      feel: v.optional(v.union(v.literal("Too easy"), v.literal("Just right"), v.literal("Too hard"))),
      completedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 25);
    const rows = await ctx.db
      .query("sessions")
      .withIndex("by_clientId_and_completedAt", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(limit);
    return rows.map((row) => ({
      goal: row.goal,
      identity: row.identity,
      readiness: row.readiness,
      minutes: row.minutes,
      moves: row.moves,
      feel: row.feel,
      completedAt: row.completedAt,
    }));
  },
});
