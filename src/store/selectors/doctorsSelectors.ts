// store/selectors/doctorsSelectors.ts
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";
import { DoctorSummary } from "@/types/doctors";

export const selectDoctorFilters = (state: RootState) => state.doctors.filters;
export const selectSearchQuery = (state: RootState) =>
  state.uiShared.searchQuery;

export const selectFilteredDoctors = (doctors: DoctorSummary[]) =>
  createSelector(
    selectDoctorFilters,
    selectSearchQuery,
    (filters, searchQuery) => {
      return doctors.filter((doc) => {
        const matchesQuery = searchQuery
          ? doc.name.toLowerCase().includes(searchQuery.toLowerCase())
          : true;

        const matchesStatus =
          filters.status === "all" ? true : doc.status === filters.status;

        console.log(doctors);

        const matchesSpecialty = filters.specialtyId
          ? doc.specialty_id === filters.specialtyId
          : true;

        return matchesQuery && matchesStatus && matchesSpecialty;
      });
    },
  );
