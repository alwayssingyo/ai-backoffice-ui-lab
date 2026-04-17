type PermissionAction = "C" | "R" | "U" | "D";

type PermissionScope = {menu: string; description: string; actions: PermissionAction[]};

export type PermissionUser = {id: string; name: string; email: string; role: string};

export type PermissionRole = {
	id: string;
	name: string;
	description: string;
	isDefault: boolean;
	isSystem: boolean;
	status: "Active" | "Inactive";
	createdAt: string;
	updatedAt: string;
	lastUsedAt: string;
	createdBy: string;
	updatedBy: string;
	users: PermissionUser[];
	scopes: PermissionScope[];
};

export const PERMISSION_ROLES: PermissionRole[] = [
	{
		id: "perm-owner",
		name: "Owner",
		description: "Full access to every project, member, and system setting.",
		isDefault: true,
		isSystem: true,
		status: "Active",
		createdAt: "2025-09-18 09:12:00",
		updatedAt: "2026-01-22 14:40:00",
		lastUsedAt: "2026-02-02 11:10:00",
		createdBy: "System",
		updatedBy: "Ari Park",
		users: [
			{id: "u-1", name: "Ari Park", email: "ari@studio.io", role: "Admin"},
			{id: "u-2", name: "Hannah Kim", email: "hannah@studio.io", role: "Admin"},
			{id: "u-3", name: "Leo Chen", email: "leo@studio.io", role: "Lead"},
		],
		scopes: [
			{menu: "Projects", description: "Create, update, and delete projects and environments.", actions: ["C", "R", "U", "D"]},
			{menu: "Members", description: "Invite, update roles, and remove members.", actions: ["C", "R", "U", "D"]},
			{menu: "Content Type Builder", description: "Manage tables and fields across all collections.", actions: ["C", "R", "U", "D"]},
			{menu: "Media Library", description: "Upload and manage assets.", actions: ["C", "R", "U", "D"]},
			{menu: "API Tokens", description: "Create and revoke tokens.", actions: ["C", "R", "D"]},
		],
	},
	{
		id: "perm-editor",
		name: "Editor",
		description: "Content-focused access with limited project settings.",
		isDefault: false,
		isSystem: false,
		status: "Active",
		createdAt: "2025-10-02 13:45:00",
		updatedAt: "2026-01-12 10:25:00",
		lastUsedAt: "2026-02-01 15:05:00",
		createdBy: "Ari Park",
		updatedBy: "Mina Seo",
		users: [
			{id: "u-4", name: "Mina Seo", email: "mina@studio.io", role: "Editor"},
			{id: "u-5", name: "Jordan Lee", email: "jordan@studio.io", role: "Editor"},
			{id: "u-6", name: "Noah Park", email: "noah@studio.io", role: "Editor"},
			{id: "u-7", name: "Sophie Jung", email: "sophie@studio.io", role: "Editor"},
		],
		scopes: [
			{menu: "Projects", description: "View project settings and environments.", actions: ["R"]},
			{menu: "Members", description: "View member list and assignments.", actions: ["R"]},
			{menu: "Content Type Builder", description: "Create and update tables and fields.", actions: ["C", "R", "U"]},
			{menu: "Content Manager", description: "Manage entries and publish content.", actions: ["C", "R", "U", "D"]},
			{menu: "Media Library", description: "Upload, update, and delete assets.", actions: ["C", "R", "U", "D"]},
		],
	},
	{
		id: "perm-analyst",
		name: "Analyst",
		description: "Read-only access to dashboards and content.",
		isDefault: false,
		isSystem: false,
		status: "Active",
		createdAt: "2025-11-10 08:30:00",
		updatedAt: "2026-01-05 18:40:00",
		lastUsedAt: "2026-01-30 17:20:00",
		createdBy: "Mina Seo",
		updatedBy: "Mina Seo",
		users: [
			{id: "u-8", name: "Dylan Cho", email: "dylan@studio.io", role: "Analyst"},
			{id: "u-9", name: "Grace Han", email: "grace@studio.io", role: "Analyst"},
		],
		scopes: [
			{menu: "Projects", description: "View project overview and status.", actions: ["R"]},
			{menu: "Members", description: "View member list.", actions: ["R"]},
			{menu: "Content Manager", description: "Read content entries and activity.", actions: ["R"]},
			{menu: "Media Library", description: "Browse assets.", actions: ["R"]},
			{menu: "Settings", description: "View system settings.", actions: ["R"]},
		],
	},
	{
		id: "perm-contract",
		name: "Contractor",
		description: "Temporary access for external collaborators.",
		isDefault: false,
		isSystem: false,
		status: "Inactive",
		createdAt: "2025-12-01 14:10:00",
		updatedAt: "2026-01-28 09:50:00",
		lastUsedAt: "2026-01-12 12:15:00",
		createdBy: "Hannah Kim",
		updatedBy: "Hannah Kim",
		users: [{id: "u-10", name: "Casey Park", email: "casey@studio.io", role: "Contractor"}],
		scopes: [
			{menu: "Content Manager", description: "Create and update assigned entries only.", actions: ["C", "R", "U"]},
			{menu: "Media Library", description: "Upload assets to shared folders.", actions: ["C", "R"]},
		],
	},
];
