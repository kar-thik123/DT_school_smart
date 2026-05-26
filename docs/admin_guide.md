# Administrative & Master Configuration Guide

This guide is designed for school administrators and IT staff responsible for managing daily operations, modules config, and enterprise governance toggles.

---

## ⚙️ Centralized Master Configuration Dashboard

All system behavior settings are managed via the Master Configuration panel under **Administration > Settings** (`/admin/administration/settings`).

### 🧩 Core Modules Integration
Toggle core platform modules ON or OFF globally:

| Feature Toggle | Description | Default Status |
|---|---|---|
| **Enable Completion Management** | Enables/disables syllabus coverage and tracking for teachers. | `Active` |
| **Enable Question Bank** | Controls teacher access to central item bank and preview tools. | `Active` |

---

## 🔔 Communication & Alerting Settings

Manage real-time notifications for institutional events:

* **Enable Completion Notifications**: When toggled, the platform sends instant WebSocket alerts and app notifications to students and parents when a classroom teacher marks a topic or unit as completed.
* **Notification Channels**: Silently resolved in the background.

---

## 🛡 Security & Governance Toggles

Ensure school data compliance and role-based integrity:

* **Enable Security Audit Logging**: When active, all data imports, teacher assignments, and permission updates are recorded in the PostgreSQL `AuditLog` table. Disable only during bulk migration tasks to conserve DB pool connections.
* **Enforce Multi-Factor Authentication (MFA)**: Adds an authentication challenge step for administrative accounts during login to protect student record privacy.

---

## 🔄 Daily Maintenance Operations

### System Backups
The system performs automatic nightly database snapshots. In case of institutional migrations, admins can perform manual schema backups. Refer to the *Deployment & Operations Guide* for specific backup terminal scripts.
