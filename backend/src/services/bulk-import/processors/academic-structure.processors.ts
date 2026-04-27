/**
 * Academic Structure Bulk Processors
 * Five independent processors — one per entity level.
 * All follow the same interface and are safe to re-run (upsert/idempotent).
 */

import { BulkImportProcessor, ResolvedDataMap, ValidationResult, CommitResult } from '../bulk-import.types';
import prisma from '../../../prisma';

// ────────────────────────────────────────────────────────────────────────────
// GRADES
// CSV: grade_name
// ────────────────────────────────────────────────────────────────────────────
export class GradeProcessor implements BulkImportProcessor {
  private activeAcademicYearId?: string;
  private fileUniqueSet = new Set<string>();
  private existingNames = new Set<string>();

  constructor(private organizationId: string, private userId: string) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    // Look up the active academic year (required for grade creation)
    const activeYear = await prisma.academicYear.findFirst({
      where: { organization_id: this.organizationId, is_active: true },
      select: { id: true }
    });
    this.activeAcademicYearId = activeYear?.id;

    // Pre-load existing grade names for this org+year to detect duplicates
    if (this.activeAcademicYearId) {
      const existing = await prisma.grade.findMany({
        where: { organization_id: this.organizationId, academic_year_id: this.activeAcademicYearId },
        select: { name: true }
      });
      this.existingNames = new Set(existing.map((g: any) => g.name.toLowerCase()));
    }
    return {};
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const gradeName = row.grade_name?.trim();
    const errors: string[] = [];

    if (!gradeName) errors.push('Missing grade_name');
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    if (!this.activeAcademicYearId) {
      errors.push('No active Academic Year found. Please create one before importing grades.');
    }
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    // Intra-file duplicate
    if (this.fileUniqueSet.has(gradeName.toLowerCase())) {
      errors.push(`Duplicate grade '${gradeName}' in this file.`);
    }
    this.fileUniqueSet.add(gradeName.toLowerCase());

    return errors.length > 0
      ? { status: 'ERROR', errors, data: row }
      : { status: 'VALID', data: { ...row, resolved_academic_year_id: this.activeAcademicYearId } };
  }

  async commit(validRows: any[]): Promise<CommitResult> {
    const r = await prisma.$transaction(async (tx: any) => {
      let success = 0, failure = 0;
      for (const row of validRows) {
        try {
          await tx.grade.upsert({
            where: { name_academic_year_id_organization_id: { name: row.grade_name.trim(), academic_year_id: row.resolved_academic_year_id, organization_id: this.organizationId } },
            create: { name: row.grade_name.trim(), academic_year_id: row.resolved_academic_year_id, organization_id: this.organizationId },
            update: {}
          });
          success++;
        } catch (e) { console.error('[GradeProcessor]', e); failure++; }
      }
      return { success, failure };
    });
    return { success_count: r.success, failure_count: r.failure };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SECTIONS
// CSV: section_name, grade_name
// ────────────────────────────────────────────────────────────────────────────
export class SectionProcessor implements BulkImportProcessor {
  private gradesMap: Record<string, any> = {};
  private fileUniqueSet = new Set<string>();

  constructor(private organizationId: string, private userId: string) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    const gradeNames = Array.from(new Set(rows.map((r: any) => r.grade_name?.trim()).filter(Boolean)));
    const grades = await prisma.grade.findMany({
      where: { organization_id: this.organizationId, name: { in: gradeNames } },
      select: { id: true, name: true }
    });
    this.gradesMap = Object.fromEntries(grades.map((g: any) => [g.name, g]));
    return this.gradesMap;
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const sectionName = row.section_name?.trim();
    const gradeName = row.grade_name?.trim();
    const errors: string[] = [];

    if (!sectionName) errors.push('Missing section_name');
    if (!gradeName) errors.push('Missing grade_name');
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    const grade = this.gradesMap[gradeName];
    if (!grade) errors.push(`Grade '${gradeName}' not found.`);
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    const key = `${grade.id}_${sectionName.toLowerCase()}`;
    if (this.fileUniqueSet.has(key)) errors.push(`Duplicate section '${sectionName}' under '${gradeName}' in this file.`);
    this.fileUniqueSet.add(key);

    return errors.length > 0
      ? { status: 'ERROR', errors, data: row }
      : { status: 'VALID', data: { ...row, resolved_grade_id: grade.id } };
  }

  async commit(validRows: any[]): Promise<CommitResult> {
    const r = await prisma.$transaction(async (tx: any) => {
      let success = 0, failure = 0;
      for (const row of validRows) {
        try {
          await tx.section.upsert({
            where: { name_grade_id_organization_id: { name: row.section_name.trim(), grade_id: row.resolved_grade_id, organization_id: this.organizationId } },
            create: { name: row.section_name.trim(), grade_id: row.resolved_grade_id, organization_id: this.organizationId },
            update: {}
          });
          success++;
        } catch (e) { console.error('[SectionProcessor]', e); failure++; }
      }
      return { success, failure };
    });
    return { success_count: r.success, failure_count: r.failure };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SUBJECTS
// CSV: subject_name, grade_name
// ────────────────────────────────────────────────────────────────────────────
export class SubjectProcessor implements BulkImportProcessor {
  private gradesMap: Record<string, any> = {};
  private fileUniqueSet = new Set<string>();

  constructor(private organizationId: string, private userId: string) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    const gradeNames = Array.from(new Set(rows.map((r: any) => r.grade_name?.trim()).filter(Boolean)));
    const grades = await prisma.grade.findMany({
      where: { organization_id: this.organizationId, name: { in: gradeNames } },
      select: { id: true, name: true }
    });
    this.gradesMap = Object.fromEntries(grades.map((g: any) => [g.name, g]));
    return this.gradesMap;
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const subjectName = row.subject_name?.trim();
    const gradeName = row.grade_name?.trim();
    const errors: string[] = [];

    if (!subjectName) errors.push('Missing subject_name');
    if (!gradeName) errors.push('Missing grade_name');
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    const grade = this.gradesMap[gradeName];
    if (!grade) errors.push(`Grade '${gradeName}' not found.`);
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    const key = `${grade.id}_${subjectName.toLowerCase()}`;
    if (this.fileUniqueSet.has(key)) errors.push(`Duplicate subject '${subjectName}' under '${gradeName}' in this file.`);
    this.fileUniqueSet.add(key);

    return errors.length > 0
      ? { status: 'ERROR', errors, data: row }
      : { status: 'VALID', data: { ...row, resolved_grade_id: grade.id } };
  }

  async commit(validRows: any[]): Promise<CommitResult> {
    const r = await prisma.$transaction(async (tx: any) => {
      let success = 0, failure = 0;
      for (const row of validRows) {
        try {
          await tx.subject.upsert({
            where: { name_grade_id_organization_id: { name: row.subject_name.trim(), grade_id: row.resolved_grade_id, organization_id: this.organizationId } },
            create: { name: row.subject_name.trim(), grade_id: row.resolved_grade_id, organization_id: this.organizationId },
            update: {}
          });
          success++;
        } catch (e) { console.error('[SubjectProcessor]', e); failure++; }
      }
      return { success, failure };
    });
    return { success_count: r.success, failure_count: r.failure };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// UNITS
// CSV: unit_name, subject_name
// ────────────────────────────────────────────────────────────────────────────
export class UnitProcessor implements BulkImportProcessor {
  private subjectsMap: Record<string, any> = {};
  private fileUniqueSet = new Set<string>();

  constructor(private organizationId: string, private userId: string) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    const subjectNames = Array.from(new Set(rows.map((r: any) => r.subject_name?.trim()).filter(Boolean)));
    const subjects = await prisma.subject.findMany({
      where: { organization_id: this.organizationId, name: { in: subjectNames } },
      select: { id: true, name: true }
    });
    this.subjectsMap = Object.fromEntries(subjects.map((s: any) => [s.name, s]));
    return this.subjectsMap;
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const unitName = row.unit_name?.trim();
    const subjectName = row.subject_name?.trim();
    const errors: string[] = [];

    if (!unitName) errors.push('Missing unit_name');
    if (!subjectName) errors.push('Missing subject_name');
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    const subject = this.subjectsMap[subjectName];
    if (!subject) errors.push(`Subject '${subjectName}' not found.`);
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    const key = `${subject.id}_${unitName.toLowerCase()}`;
    if (this.fileUniqueSet.has(key)) errors.push(`Duplicate unit '${unitName}' under '${subjectName}' in this file.`);
    this.fileUniqueSet.add(key);

    return errors.length > 0
      ? { status: 'ERROR', errors, data: row }
      : { status: 'VALID', data: { ...row, resolved_subject_id: subject.id } };
  }

  async commit(validRows: any[]): Promise<CommitResult> {
    const r = await prisma.$transaction(async (tx: any) => {
      let success = 0, failure = 0;
      for (const row of validRows) {
        try {
          // Unit has no unique constraint — check existence first
          const exists = await tx.unit.findFirst({
            where: { name: row.unit_name.trim(), subject_id: row.resolved_subject_id, organization_id: this.organizationId }
          });
          if (!exists) {
            await tx.unit.create({
              data: { name: row.unit_name.trim(), subject_id: row.resolved_subject_id, organization_id: this.organizationId }
            });
          }
          success++;
        } catch (e) { console.error('[UnitProcessor]', e); failure++; }
      }
      return { success, failure };
    });
    return { success_count: r.success, failure_count: r.failure };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// TOPICS
// CSV: topic_name, unit_name
// ────────────────────────────────────────────────────────────────────────────
export class TopicProcessor implements BulkImportProcessor {
  private unitsMap: Record<string, any> = {};
  private fileUniqueSet = new Set<string>();

  constructor(private organizationId: string, private userId: string) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    const unitNames = Array.from(new Set(rows.map((r: any) => r.unit_name?.trim()).filter(Boolean)));
    const units = await prisma.unit.findMany({
      where: { organization_id: this.organizationId, name: { in: unitNames } },
      select: { id: true, name: true }
    });
    this.unitsMap = Object.fromEntries(units.map((u: any) => [u.name, u]));
    return this.unitsMap;
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const topicName = row.topic_name?.trim();
    const unitName = row.unit_name?.trim();
    const errors: string[] = [];

    if (!topicName) errors.push('Missing topic_name');
    if (!unitName) errors.push('Missing unit_name');
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    const unit = this.unitsMap[unitName];
    if (!unit) errors.push(`Unit '${unitName}' not found.`);
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    const key = `${unit.id}_${topicName.toLowerCase()}`;
    if (this.fileUniqueSet.has(key)) errors.push(`Duplicate topic '${topicName}' under '${unitName}' in this file.`);
    this.fileUniqueSet.add(key);

    return errors.length > 0
      ? { status: 'ERROR', errors, data: row }
      : { status: 'VALID', data: { ...row, resolved_unit_id: unit.id } };
  }

  async commit(validRows: any[]): Promise<CommitResult> {
    const r = await prisma.$transaction(async (tx: any) => {
      let success = 0, failure = 0;
      for (const row of validRows) {
        try {
          // Topic has no unique constraint — check existence first
          const exists = await tx.topic.findFirst({
            where: { name: row.topic_name.trim(), unit_id: row.resolved_unit_id, organization_id: this.organizationId }
          });
          if (!exists) {
            await tx.topic.create({
              data: { name: row.topic_name.trim(), unit_id: row.resolved_unit_id, organization_id: this.organizationId }
            });
          }
          success++;
        } catch (e) { console.error('[TopicProcessor]', e); failure++; }
      }
      return { success, failure };
    });
    return { success_count: r.success, failure_count: r.failure };
  }
}
