import {create} from "zustand";
import {combine, createJSONStorage, persist} from "zustand/middleware";
import {util} from "@/entry/util.ts";
import type {PermissionGroupResponse} from "@/services/types/permission-group-response.ts";

export const useRoleStore = create(
	persist(
		combine({isRoleReady: false, isSuperAdmin: false, superAdminPermissionGroupIds: [] as number[]}, (set) => ({
			setRoleName: (roleName?: string) => {
				if (typeof roleName !== "string") {
					set({isRoleReady: true, isSuperAdmin: false});
					return;
				}

				set({isRoleReady: true, isSuperAdmin: util.auth.isSuperAdminRoleName(roleName)});
			},
			setPermissionGroups: (permissionGroups: PermissionGroupResponse[]) => {
				const superAdminPermissionGroupIds = permissionGroups
					.filter((permissionGroup) => util.auth.isSuperAdminRoleName(permissionGroup.name))
					.map((permissionGroup) => permissionGroup.id);

				set({superAdminPermissionGroupIds});
			},
			reset: () => {
				set({isRoleReady: false, isSuperAdmin: false, superAdminPermissionGroupIds: []});
			},
		})),
		{name: "r_s", storage: createJSONStorage(() => sessionStorage)},
	),
);
