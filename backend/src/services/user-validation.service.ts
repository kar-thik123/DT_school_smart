import { z } from 'zod';
import prisma from '../prisma';

export class AppValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppValidationError';
  }
}

export const BaseUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format").transform(e => e.toLowerCase()),
  roll_number: z.string().optional().nullable(),
  grade_id: z.string().uuid("Invalid grade ID").optional().nullable().or(z.literal('')),
  section_id: z.string().uuid("Invalid section ID").optional().nullable().or(z.literal('')),
});

export const CreateUserSchema = BaseUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  role_id: z.string().uuid("Invalid role ID"),
  admission_number: z.string().optional().nullable(),
  mobile_number: z.string().optional().nullable(),
});

export const AdminUpdateSchema = BaseUserSchema.partial().extend({
  is_active: z.boolean().optional(),
  role_id: z.string().uuid("Invalid role ID").optional(),
  role: z.string().optional(), // for legacy string-based role updates
});

export const ProfileUpdateSchema = BaseUserSchema.omit({ roll_number: true, grade_id: true, section_id: true }).extend({
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  about: z.string().optional().nullable(),
  favorite_colour: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  academic_birth: z.string().optional().nullable(),
  academic_profiles: z.any().optional(),
  favorite_subjects: z.any().optional(),
  roll_number: z.any().optional(), 
});

export const BulkImportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format").transform(e => e.toLowerCase()),
  password: z.string().optional().nullable(),
  role: z.string().min(1, "Role is required").optional(), // Sometimes mapped to role_id
  role_id: z.string().uuid().optional().nullable(),
  grade_id: z.string().uuid().optional().nullable(),
  section_id: z.string().uuid().optional().nullable(),
  admission_number: z.string().optional().nullable(),
  mobile_number: z.string().optional().nullable(),
  roll_number: z.string().optional().nullable(),
});

export class UserValidationService {
  /**
   * Validates that an email is globally unique across the platform.
   * Throws an Error with a user-friendly message if a conflict is found.
   */
  static async checkGlobalEmailUnique(email: string, excludeUserId?: string) {
    const existing = await prisma.user.findFirst({
      where: {
        email,
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
      select: { id: true }
    });
    if (existing) {
      throw new AppValidationError(`Email '${email}' is already registered in the platform. Each email can only belong to one account.`);
    }
  }

  /**
   * Validates that admission_number and mobile_number are unique within a specific tenant.
   * Throws an Error with a user-friendly message if a conflict is found.
   */
  static async checkTenantIdentifiersUnique(orgId: string, admissionNumber?: string | null, mobileNumber?: string | null, excludeUserId?: string) {
    if (!admissionNumber && !mobileNumber) return;

    const existing = await prisma.studentProfile.findFirst({
      where: {
        organization_id: orgId,
        ...(excludeUserId && { user_id: { not: excludeUserId } }),
        OR: [
          ...(admissionNumber ? [{ admission_number: admissionNumber }] : []),
          ...(mobileNumber ? [{ mobile_number: mobileNumber }] : []),
        ],
      },
      select: { admission_number: true, mobile_number: true }
    });

    if (existing) {
      if (admissionNumber && existing.admission_number === admissionNumber) {
        throw new AppValidationError(`Admission number '${admissionNumber}' already exists in this tenant.`);
      }
      if (mobileNumber && existing.mobile_number === mobileNumber) {
        throw new AppValidationError(`Mobile number '${mobileNumber}' already exists in this tenant.`);
      }
    }
  }
}
