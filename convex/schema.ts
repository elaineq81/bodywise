import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    clientId: v.string(),
    goal: v.string(),
    age: v.string(),
    sex: v.string(),
    level: v.string(),
    targetMinutes: v.number(),
    quiet: v.boolean(),
    updatedAt: v.number(),
  }).index("by_clientId", ["clientId"]),
  sessions: defineTable({
    clientId: v.string(),
    goal: v.string(),
    identity: v.string(),
    readiness: v.string(),
    minutes: v.number(),
    moves: v.array(v.string()),
    feel: v.optional(v.union(v.literal("Too easy"), v.literal("Just right"), v.literal("Too hard"))),
    completedAt: v.number(),
  }).index("by_clientId_and_completedAt", ["clientId", "completedAt"]),
});
