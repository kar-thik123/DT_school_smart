"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const zod_1 = require("zod");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const permissions_1 = require("../config/permissions");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const authorization_service_1 = require("../services/authorization.service");
const router = (0, express_1.Router)();
// Configure Multer for Logo Uploads
const storage = multer_1.default.diskStorage({
    destination: 'uploads/logos/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'logo-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
// Ensure upload directory exists (Helper)
const fs = require('fs');
if (!fs.existsSync('uploads/logos/')) {
    fs.mkdirSync('uploads/logos/', { recursive: true });
}
router.post('/upload-logo', upload.single('logo'), (req, res) => {
    if (!req.file)
        return res.status(400).json({ message: 'No file uploaded' });
    const logoUrl = `/api/uploads/logos/${req.file.filename}`;
    res.json({ logoUrl });
});
router.get('/debug-db', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_SYSTEM_ADMIN'), async (req, res) => {
    const orgs = await prisma_1.default.organization.findMany();
    res.json({ orgs });
});
// 1. Check Subdomain Availability
router.get('/check-subdomain', async (req, res) => {
    const { q } = req.query;
    if (!q)
        return res.status(400).json({ message: 'Query required' });
    const existing = await prisma_1.default.organization.findUnique({ where: { subdomain: q } });
    res.json({ available: !existing });
});
// 3.5 Get My Organization License (For Super Admin Dashboard)
router.get('/me/license', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_SUPER_ADMIN'), async (req, res) => {
    try {
        const org = await prisma_1.default.organization.findUnique({
            where: { id: req.user.organization_id },
            include: {
                license: true,
                _count: { select: { users: { where: { is_active: true } } } }
            }
        });
        if (!org)
            return res.status(404).json({ message: 'Organization not found' });
        const license = org.license;
        const activeUsers = org._count.users;
        const limit = license?.licensed_seats || org.login_limit || 100;
        const usagePercent = Math.round((activeUsers / limit) * 100);
        res.json({
            school_name: org.school_name,
            limit,
            activeUsers,
            usagePercent,
            renewal_date: license?.renewal_date,
            status: license?.status || 'ACTIVE',
            warning_threshold: license?.warning_threshold || 80
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch license info' });
    }
});
/**
 * GET /api/organizations/me/profile
 * Get full profile of current organization
 */
router.get('/me/profile', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const org = await prisma_1.default.organization.findUnique({
            where: { id: req.user.organization_id }
        });
        if (!org)
            return res.status(404).json({ message: 'Organization not found' });
        res.json(org);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.use(auth_middleware_1.authMiddleware);
router.use((0, auth_middleware_1.requirePermission)('IDENTITY', 'IS_SYSTEM_ADMIN'));
// 4. Get Platform Statistics
router.get('/stats', async (req, res) => {
    try {
        const total = await prisma_1.default.organization.count();
        const active = await prisma_1.default.organization.count({ where: { backup_enabled: true } }); // Example: using backup_enabled as a proxy for 'active' status for now
        const recent = await prisma_1.default.organization.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            select: { id: true, school_name: true, subdomain: true, created_at: true }
        });
        res.json({ total, active, suspended: 0, trial: 0, recent });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});
// 5. Get Single Organization Details
router.get('/:id', async (req, res) => {
    try {
        const org = await prisma_1.default.organization.findUnique({
            where: { id: req.params.id },
            include: {
                _count: { select: { users: true } },
                users: {
                    where: { role: { name: 'SUPER_ADMIN' } },
                    take: 1
                }
            }
        });
        if (!org)
            return res.status(404).json({ message: 'Organization not found' });
        res.json(org);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// 6. Update Organization Status (Lifecycle)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body; // Expecting OrganizationStatus enum value
        // Safety check: Prevent suspending/archiving platform core
        const target = await prisma_1.default.organization.findUnique({ where: { id: req.params.id } });
        if (target?.subdomain === 'sys' && (status === 'SUSPENDED' || status === 'ARCHIVED')) {
            return res.status(403).json({ message: 'Platform Core organization cannot be suspended or archived' });
        }
        const updated = await prisma_1.default.organization.update({
            where: { id: req.params.id },
            data: { status: status }
        });
        res.json({
            message: `Organization status updated to ${status}`,
            status: updated.status
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update status' });
    }
});
// 6.5 Update Organization Settings (Platform Developer)
router.patch('/:id/settings', async (req, res) => {
    try {
        const orgId = req.params.id;
        const { school_name, contact_email, subdomain, domain_type, login_limit, smtp_host, smtp_port, backup_enabled } = req.body;
        const currentOrg = await prisma_1.default.organization.findUnique({
            where: { id: orgId },
            include: { license: true }
        });
        if (!currentOrg)
            return res.status(404).json({ message: 'Organization not found' });
        // Validate subdomain uniqueness
        if (subdomain && subdomain !== currentOrg.subdomain) {
            const existing = await prisma_1.default.organization.findUnique({ where: { subdomain } });
            if (existing) {
                return res.status(400).json({ message: `Subdomain '${subdomain}' is already in use.` });
            }
        }
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const updatedOrg = await tx.organization.update({
                where: { id: orgId },
                data: {
                    school_name: school_name !== undefined ? school_name : undefined,
                    contact_email: contact_email !== undefined ? contact_email : undefined,
                    subdomain: subdomain !== undefined ? subdomain : undefined,
                    domain_type: domain_type !== undefined ? domain_type : undefined,
                    login_limit: login_limit !== undefined ? Number(login_limit) : undefined,
                    smtp_host: smtp_host !== undefined ? smtp_host : undefined,
                    smtp_port: smtp_port !== undefined ? Number(smtp_port) : undefined,
                    backup_enabled: backup_enabled !== undefined ? backup_enabled === true : undefined
                }
            });
            if (login_limit !== undefined && currentOrg.license) {
                await tx.organizationLicense.update({
                    where: { organization_id: orgId },
                    data: { licensed_seats: Number(login_limit) }
                });
            }
            // Record Audit Log
            await tx.auditLog.create({
                data: {
                    organization_id: orgId,
                    user_id: req.user.user_id,
                    user_name: req.user.name || 'System Admin',
                    action_type: 'UPDATE',
                    entity_type: 'ORGANIZATION',
                    entity_id: orgId,
                    metadata: {
                        previousValues: {
                            school_name: currentOrg.school_name,
                            contact_email: currentOrg.contact_email,
                            subdomain: currentOrg.subdomain,
                            domain_type: currentOrg.domain_type,
                            login_limit: currentOrg.login_limit,
                            smtp_host: currentOrg.smtp_host,
                            smtp_port: currentOrg.smtp_port,
                            backup_enabled: currentOrg.backup_enabled
                        },
                        newValues: {
                            school_name: updatedOrg.school_name,
                            contact_email: updatedOrg.contact_email,
                            subdomain: updatedOrg.subdomain,
                            domain_type: updatedOrg.domain_type,
                            login_limit: updatedOrg.login_limit,
                            smtp_host: updatedOrg.smtp_host,
                            smtp_port: updatedOrg.smtp_port,
                            backup_enabled: updatedOrg.backup_enabled
                        }
                    }
                }
            });
            return updatedOrg;
        });
        res.json({ message: 'Organization settings updated', organization: updated });
    }
    catch (error) {
        console.error('[ORG SETTINGS UPDATE ERROR]', error);
        res.status(500).json({ message: 'Failed to update organization settings' });
    }
});
// 3. Pre-flight Provisioning Validation
router.post('/validate-provisioning', async (req, res) => {
    try {
        const { subdomain, admin_email, model } = req.body;
        const checks = {
            subdomainAvailable: true,
            adminEmailAvailable: true,
            errors: []
        };
        if (subdomain && model === 'SaaS') {
            const org = await prisma_1.default.organization.findUnique({ where: { subdomain } });
            if (org) {
                checks.subdomainAvailable = false;
                checks.errors.push(`Subdomain '${subdomain}' is taken`);
            }
        }
        if (admin_email) {
            const user = await prisma_1.default.user.findFirst({ where: { email: admin_email } });
            if (user) {
                checks.adminEmailAvailable = false;
                checks.errors.push(`Admin email '${admin_email}' is already registered`);
            }
        }
        console.log('[DEBUG] Provisioning validation:', { subdomain, model, checks });
        res.json({
            ready: checks.errors.length === 0,
            ...checks
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Validation failed' });
    }
});
const orgSchema = zod_1.z.object({
    // Core
    school_name: zod_1.z.string().nullish().or(zod_1.z.literal('')),
    school_type: zod_1.z.string().nullish(),
    medium: zod_1.z.string().nullish(),
    // Contact
    contact_email: zod_1.z.string().email().nullish().or(zod_1.z.literal('')),
    contact_phone: zod_1.z.string().nullish(),
    address: zod_1.z.string().nullish(),
    logo_url: zod_1.z.string().nullish().or(zod_1.z.literal('')),
    // Domain
    domain_type: zod_1.z.enum(['Platform Domain', 'Subdomain', 'Custom Domain']).default('Platform Domain'),
    subdomain: zod_1.z.string().nullish().or(zod_1.z.literal('')),
    custom_domain: zod_1.z.string().nullish(),
    // Settings
    backup_enabled: zod_1.z.boolean().default(false),
    // License Config
    licensed_seats: zod_1.z.coerce.number().min(1).default(100),
    renewal_date: zod_1.z.string().nullish().or(zod_1.z.literal('')),
    grace_period_days: zod_1.z.coerce.number().min(0).default(7),
    warning_threshold: zod_1.z.coerce.number().min(50).max(100).default(80),
    internal_notes: zod_1.z.string().nullish(),
    // Admin (ignored at creation, kept for future use)
    admin_name: zod_1.z.string().nullish().or(zod_1.z.literal('')),
    admin_email: zod_1.z.string().nullish().or(zod_1.z.literal('')),
    admin_password: zod_1.z.string().nullish().or(zod_1.z.literal('')),
    initial_academic_year: zod_1.z.string().min(1, "Initial Academic Year is required"),
});
// Helper to recursively or flat-clean object values: "" and undefined -> null
function cleanInput(data) {
    const cleaned = {};
    for (const key in data) {
        if (data[key] === '' || data[key] === undefined) {
            cleaned[key] = null;
        }
        else if (typeof data[key] === 'string') {
            cleaned[key] = data[key].trim() || null;
        }
        else {
            cleaned[key] = data[key];
        }
    }
    return cleaned;
}
router.post('/', async (req, res) => {
    try {
        console.log('--- BACKEND AUDIT LOGGING ---');
        console.log('req.body.logo_url:', req.body.logo_url);
        console.log('[ORG CREATE RAW BODY]', req.body);
        // Clean strings before schema parse and db insertion
        const cleanedBody = cleanInput(req.body);
        const parsed = orgSchema.parse(cleanedBody);
        console.log('[DEBUG] Schema parsed successfully:', parsed);
        console.log('parsed.logo_url:', parsed.logo_url);
        const dbPayloadLogoUrl = parsed.logo_url || null;
        console.log('Prisma create() data.logo_url:', dbPayloadLogoUrl);
        // Check subdomain uniqueness only if properly provided
        if (parsed.subdomain) {
            console.log(`[DEBUG] Checking uniqueness for subdomain: ${parsed.subdomain}`);
            const existingOrg = await prisma_1.default.organization.findUnique({ where: { subdomain: parsed.subdomain } });
            if (existingOrg) {
                return res.status(400).json({ message: `Subdomain '${parsed.subdomain}' is already in use by '${existingOrg.school_name}'. Choose another.` });
            }
        }
        console.log('[DEBUG] Proceeding to create organization and admin user...');
        // Pre-hash password before starting transaction to avoid slow execution within interactive transaction
        let preHashedPassword = '';
        if (parsed.admin_email && parsed.admin_password) {
            preHashedPassword = await bcrypt_1.default.hash(parsed.admin_password, 10);
        }
        // Wrap org + admin user creation in a transaction with extended 30s timeout
        const result = await prisma_1.default.$transaction(async (tx) => {
            // STEP 1: Create the organization
            const org = await tx.organization.create({
                data: {
                    school_name: parsed.school_name || 'Unnamed School',
                    school_type: parsed.school_type || null,
                    medium: parsed.medium || null,
                    contact_email: parsed.contact_email || null,
                    contact_phone: parsed.contact_phone || null,
                    address: parsed.address || null,
                    logo_url: parsed.logo_url || null,
                    domain_type: parsed.domain_type || 'Platform Domain',
                    subdomain: parsed.subdomain || null,
                    custom_domain: parsed.custom_domain || null,
                    backup_enabled: parsed.backup_enabled === true,
                    login_limit: Number(parsed.licensed_seats) || 100,
                }
            });
            console.log(`[TX STEP 1] Organization created: id=${org.id}, name=${org.school_name}`);
            // STEP 1.5: Create the Organization License
            await tx.organizationLicense.create({
                data: {
                    organization_id: org.id,
                    licensed_seats: Number(parsed.licensed_seats) || 100,
                    renewal_date: parsed.renewal_date ? new Date(parsed.renewal_date) : null,
                    grace_period_days: Number(parsed.grace_period_days) || 7,
                    warning_threshold: Number(parsed.warning_threshold) || 80,
                    internal_notes: parsed.internal_notes || null,
                    status: 'ACTIVE'
                }
            });
            console.log(`[TX STEP 1.5] License created for org: ${org.id}`);
            // STEP 2: Create SUPER_ADMIN user if admin credentials were provided
            let adminUser = null;
            if (parsed.admin_email && parsed.admin_password) {
                // STEP 2.1: Check email is not already taken globally
                const emailTaken = await tx.user.findFirst({ where: { email: parsed.admin_email } });
                if (emailTaken) {
                    throw new Error(`ADMIN_EMAIL_CONFLICT:The email '${parsed.admin_email}' is already registered in the platform. Use a different email for this school's admin.`);
                }
                console.log(`[TX STEP 2.1] Admin email '${parsed.admin_email}' is available.`);
                // STEP 2.2: Create a tenant-owned SUPER_ADMIN role for this organization.
                // IMPORTANT: Never reuse a role from the sys org or any other tenant.
                // Each tenant gets its own SUPER_ADMIN role scoped to organization_id = org.id.
                // This preserves strict multi-tenant isolation and permission-driven identity.
                const superAdminRole = await tx.role.create({
                    data: {
                        name: 'SUPER_ADMIN',
                        description: 'School Owner — full access to this school tenant',
                        organization_id: org.id, // Scoped exclusively to this new tenant
                        is_system: true, // System-managed, not user-editable
                    }
                });
                console.log(`[TX STEP 2.2] Tenant SUPER_ADMIN role created: id=${superAdminRole.id}, org=${org.id}`);
                // STEP 2.2.5: Bootstrap ALL permissions for the new role.
                // This ensures the new SUPER_ADMIN user has access to all tenant modules without bypassing the permission system.
                let superAdminPermission = await tx.permission.findUnique({
                    where: { module_action: { module: 'IDENTITY', action: 'IS_SUPER_ADMIN' } }
                });
                if (!superAdminPermission) {
                    superAdminPermission = await tx.permission.create({
                        data: {
                            module: 'IDENTITY',
                            action: 'IS_SUPER_ADMIN',
                            description: 'Identifies user as a tenant owner (school SUPER_ADMIN)'
                        }
                    });
                }
                const allSystemPermissions = await tx.permission.findMany();
                const tenantDbPermissions = allSystemPermissions.filter((p) => permissions_1.PERMISSION_DOMAINS[p.module] === 'TENANT' &&
                    !(p.module === 'IDENTITY' && p.action === 'IS_SYSTEM_ADMIN'));
                const rolePermissionsData = tenantDbPermissions.map((p) => ({
                    role_id: superAdminRole.id,
                    permission_id: p.id
                }));
                await tx.rolePermission.createMany({
                    data: rolePermissionsData,
                    skipDuplicates: true
                });
                console.log(`[TX STEP 2.2.5] Mapped all permissions to SUPER_ADMIN role (org: ${org.id})`);
                // STEP 2.3: Use pre-hashed admin password
                console.log(`[TX STEP 2.3] Using pre-hashed password for admin: ${parsed.admin_email}`);
                // STEP 2.4: Create the super admin user assigned to the tenant-owned role
                adminUser = await tx.user.create({
                    data: {
                        name: parsed.admin_name || 'School Admin',
                        email: parsed.admin_email,
                        password_hash: preHashedPassword,
                        role_id: superAdminRole.id,
                        organization_id: org.id,
                        is_active: true,
                    }
                });
                console.log(`[TX STEP 2.4] Super admin user created: id=${adminUser.id}, email=${adminUser.email}, role=${superAdminRole.id}`);
            }
            // STEP 3: Create Initial Academic Year
            const initialAcademicYear = await tx.academicYear.create({
                data: {
                    name: parsed.initial_academic_year,
                    start_date: null,
                    end_date: null,
                    is_active: true,
                    organization_id: org.id
                }
            });
            console.log(`[TX STEP 3] Initial Academic Year created and activated for org: ${org.id}`);
            // STEP 3.5: Set the initial academic year as the globally active year in ModuleConfig
            await tx.moduleConfig.create({
                data: {
                    organization_id: org.id,
                    module_name: 'master-config',
                    config_data: { active_academic_year_id: initialAcademicYear.id }
                }
            });
            console.log(`[TX STEP 3.5] Active Academic Year ID injected into master-config for org: ${org.id}`);
            console.log(`[TX COMMITTED] Provisioning complete for org: ${org.id}`);
            return { org, adminUser };
        }, { timeout: 30000 });
        // 4. Fire Async Hooks (e.g. Emails/Provisioning) safely WITHOUT blocking the API response
        if (result.adminUser) {
            // simulate background email dispatch
            Promise.resolve().then(() => {
                console.log(`[Background Job] Dispatching welcome email to ${result.adminUser.email}`);
            }).catch(err => console.error('[Background Job Error]', err));
        }
        // 5. Explicit return to end execution context
        return res.status(201).json({
            message: 'Organization provisioned successfully',
            organizationId: result.org.id,
            adminCreated: !!result.adminUser,
            adminEmail: result.adminUser?.email || null,
        });
    }
    catch (error) {
        console.error('[ORG CREATE ERROR LOG]', error);
        if (error?.errors) {
            console.error('[ZOD ERRORS]', JSON.stringify(error.errors, null, 2));
        }
        // Handle custom business logic errors thrown from inside the transaction
        if (typeof error?.message === 'string' && error.message.includes(':')) {
            const [code, msg] = error.message.split(/:(.+)/);
            if (code === 'ADMIN_EMAIL_CONFLICT' || code === 'ROLE_MISSING') {
                return res.status(400).json({ message: msg?.trim() || error.message });
            }
        }
        // Handle Zod validation errors
        if (error?.errors) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: error.errors,
                details: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
            });
        }
        // Handle Prisma unique constraint error
        if (error?.code === 'P2002') {
            return res.status(400).json({ message: `A conflict occurred: The ${error.meta?.target?.join(', ') || 'field'} is already in use. Choose another.` });
        }
        return res.status(500).json({ message: error?.message || 'Internal server error' });
    }
});
// GET all organizations (IT Setup only)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        // Exclude the platform core 'sys' tenant.
        // Must also include orgs where subdomain IS NULL (on-premise / custom-domain tenants)
        // because PostgreSQL's != operator does not match NULL rows.
        const sysExcludeClause = {
            OR: [
                { subdomain: null },
                { subdomain: { not: 'sys' } }
            ]
        };
        const where = { ...sysExcludeClause };
        if (search) {
            where.AND = [
                sysExcludeClause,
                {
                    OR: [
                        { school_name: { contains: search, mode: 'insensitive' } },
                        { subdomain: { contains: search, mode: 'insensitive' } }
                    ]
                }
            ];
        }
        if (status) {
            where.status = status;
        }
        const [orgs, total] = await prisma_1.default.$transaction([
            prisma_1.default.organization.findMany({
                where,
                select: {
                    id: true, school_name: true, school_type: true, subdomain: true,
                    contact_email: true, login_limit: true, backup_enabled: true, created_at: true,
                    status: true,
                    _count: { select: { users: true } },
                    users: {
                        where: { role: { name: 'SUPER_ADMIN' } },
                        take: 1,
                        select: { email: true }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma_1.default.organization.count({ where })
        ]);
        res.json({
            data: orgs,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('[GET ORGS ERROR]', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// PATCH - allow school admin to update their own org branding
router.patch('/:id/branding', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { school_name, logo_url, contact_email, contact_phone, address } = req.body;
        // Only allow SUPER_ADMIN of the org or SYSTEM_ADMIN
        const userPermissions = req.user.permissions || [];
        const isSelf = authorization_service_1.AuthorizationService.hasIdentity(userPermissions, 'IS_SUPER_ADMIN') && req.user.organization_id === req.params.id;
        const isIT = authorization_service_1.AuthorizationService.hasIdentity(userPermissions, 'IS_SYSTEM_ADMIN');
        if (!isSelf && !isIT)
            return res.status(403).json({ message: 'Forbidden' });
        const updated = await prisma_1.default.organization.update({
            where: { id: req.params.id },
            data: { school_name, logo_url, contact_email, contact_phone, address }
        });
        res.json({ message: 'Branding updated', organization: updated });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// DELETE organization (IT Setup only)
router.delete('/:id', async (req, res) => {
    try {
        await prisma_1.default.organization.delete({ where: { id: req.params.id } });
        res.json({ message: 'Organization deleted successfully' });
    }
    catch (error) {
        console.error('Delete organization error:', error);
        if (error.code === 'P2003') {
            return res.status(400).json({ message: 'Organization cannot be deleted due to active cross-tenant reference or dependent records' });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Organization not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
