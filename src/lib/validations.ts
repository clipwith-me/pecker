import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  phone: z.string().optional(),
  role: z.enum(["RESIDENT", "RESPONDER"]).default("RESIDENT"),
  city: z.string().max(100).optional(),
  community: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createIncidentSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().max(2000).optional(),
  category: z.enum([
    "BROKEN_STREETLIGHT",
    "FLOODING",
    "GARBAGE_OVERFLOW",
    "DRAINAGE_ISSUE",
    "ROAD_DAMAGE",
    "SAFETY_SECURITY",
    "VANDALISM",
    "OTHER",
  ]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  locationText: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  community: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  isAnonymous: z.boolean().default(false),
  guestName: z.string().min(2).max(100).optional(),
});

export const editIncidentSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  locationText: z.string().max(500).nullable().optional(),
  locationLat: z.number().min(-90).max(90).nullable().optional(),
  locationLng: z.number().min(-180).max(180).nullable().optional(),
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"]),
  note: z.string().max(1000).optional(),
});

export const assignIncidentSchema = z.object({
  assignedToId: z.string().cuid().nullable(),
  note: z.string().max(1000).optional(),
});

export const addNoteSchema = z.object({
  note: z.string().min(1, "Note cannot be empty").max(2000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
export type AssignIncidentInput = z.infer<typeof assignIncidentSchema>;
