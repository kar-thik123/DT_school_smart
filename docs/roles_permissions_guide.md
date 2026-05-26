# Roles & Permissions Governance Guide

The School SaaS Platform utilizes a rigorous, capability-driven authorization model. This guide outlines systemic roles, active permission registries, and governance practices to prevent unauthorized privilege transitions.

---

## 🔑 Systemic Roles Overview

The platform is pre-configured with four core roles, each isolated to prevent tenant-crossing security failures:

1. **SUPER_ADMIN**: The highest-level role inside a tenant organization. Protected from self-deletion or modification. Sees all administrative dashboards.
2. **MANAGEMENT**: Designed for school principals, board members, and academic directors. Allows view access to analytics, teacher assignments, and read-only system logs.
3. **TEACHER**: Standard classroom educator. Allowed to manage syllabus completion, view assigned student performances, and access the Question Bank.
4. **STUDENT**: Basic student account. Restructured to only access practice environments and personal dashboards. Has zero access to administrative interfaces.

---

## 🔒 Granular Permissions Matrix

Granular capabilities are strictly enforced in both the frontend (UI visibility guards) and backend (Express middleware decorators).

### Active Permissions Registry

| Permission | Target Module | Action Allowed | Authorized Roles (Default) |
|---|---|---|---|
| `QUESTION_BANK:VIEW` | Question Bank | View questions | Super Admin, Management, Teacher |
| `QUESTION_BANK:IMPORT` | Question Bank | Bulk import via Excel | Super Admin, Teacher (if granted) |
| `COMPLETION_TRACKING:VIEW` | Completion Mgmt | View syllabus tracker | Super Admin, Management, Teacher |
| `COMPLETION_TRACKING:MANAGE`| Completion Mgmt | Toggle topic/unit coverage | Super Admin, Teacher |
| `ANALYTICS:VIEW_OWN` | Analytics | View assigned classroom data | Teacher |
| `ANALYTICS:VIEW_ALL` | Analytics | View consolidated school overview | Super Admin, Management |
| `MASTER_CONFIGURATION:VIEW` | Settings | View system configuration settings| Super Admin, Management |
| `MASTER_CONFIGURATION:MANAGE` | Settings | Change master settings | Super Admin |

---

## ⚠️ Security Governance Policies

### 1. Protection of System Roles
* **SUPER_ADMIN Locked**: The `SUPER_ADMIN` role permissions are immutable and hard-locked to prevent accidental lockouts.
* **No Self-Demotion**: Administrators cannot edit or delete their own active user role.

### 2. Double-Layer Enforcement
Frontend components use structural Angular directives (e.g. checking permission sets in local storage) to hide menus. The backend decodes the incoming JWT token, queries active DB roles, and enforces the equivalent middleware:
```typescript
router.put('/settings', requirePermission('COMPLETION_TRACKING', 'MANAGE'), (req, res) => { ... });
```
> [!IMPORTANT]
> Never assume client-side hidden elements are secure. Always audit and enforce matching middleware boundaries on any backend REST endpoints.
