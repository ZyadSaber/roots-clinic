import { User } from "@/types/staff";
import { RootState } from "@/store/store";
import { createSelector } from "@reduxjs/toolkit";

export const selectSelectedUserId = (state: RootState) =>
  state.staff.selectedUserId;

export const selectRoleFilter = (state: RootState) => state.staff.filter.role;

export const selectStatusFilter = (state: RootState) =>
  state.staff.filter.status;

export const selectFilteredUsers = (users: User[]) =>
  createSelector(
    selectRoleFilter,
    selectStatusFilter,
    (state: RootState) => state.uiShared.searchQuery,
    (role, status, searchQuery) => {
      return users.filter((user) => {
        if (role !== "all" && user.role !== role) return false;

        if (status === "active" && !user.is_active) return false;
        if (status === "inactive" && user.is_active) return false;

        // Search filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesName = user.full_name.toLowerCase().includes(q);
          const matchesUsername = user.username.toLowerCase().includes(q);
          const matchesEmail = user.email?.toLowerCase().includes(q) ?? false;
          if (!matchesName && !matchesUsername && !matchesEmail) return false;
        }

        return true;
      });
    },
  );

export const selectSelectedStaff = (users: User[]) =>
  createSelector(
    selectSelectedUserId,
    (selectedId) => users.find((u) => u.id === selectedId) ?? null,
  );
