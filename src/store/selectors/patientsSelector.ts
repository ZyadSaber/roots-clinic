// store/selectors/patientSelectors.ts
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";
import { PatientSummary } from "@/types/patients";

const selectPatientState = (state: RootState) => state.patients;

export const selectPatientFilters = createSelector(
  selectPatientState,
  (state) => state.filters,
);

export const selectSelectedPatientId = createSelector(
  selectPatientState,
  (state) => state.selectedPatientId,
);

export const selectSelectedPatient = (patients: PatientSummary[]) =>
  createSelector(
    selectSelectedPatientId,
    (selectedId) => patients.find((p) => p.patient_id === selectedId) ?? null,
  );

export const selectFilteredPatients = (patients: PatientSummary[]) =>
  createSelector(
    selectPatientFilters,
    (state: RootState) => state.uiShared.searchQuery,
    (filters, searchQuery) => {
      return patients.filter((p) => {
        // Gender filter
        if (filters.gender !== "all" && p.gender !== filters.gender)
          return false;

        // Insurance filter — only active when checkbox is ON
        if (filters.hasInsurance && !p.insurance_company_name) return false;

        // Critical alert filter — only active when checkbox is ON
        if (filters.hasCriticalAlert && !p.has_critical_alert) return false;

        // Search filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.full_name.toLowerCase().includes(q);
          const matchesCode = p.patient_code.toLowerCase().includes(q);
          const matchesPhone = p.phone.toLowerCase().includes(q);
          const matchesEmail = p.email?.toLowerCase().includes(q) ?? false;
          const matchesInsurance =
            p.insurance_number?.toLowerCase().includes(q) ?? false;

          if (
            !matchesName &&
            !matchesCode &&
            !matchesPhone &&
            !matchesEmail &&
            !matchesInsurance
          )
            return false;
        }

        return true;
      });
    },
  );

// Stats derived from the full unfiltered list
export const selectPatientStats = (patients: PatientSummary[]) =>
  createSelector(selectPatientFilters, () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: patients.length,
      newThisMonth: patients.filter(
        (p) => new Date(p.created_at) >= startOfMonth,
      ).length,
      critical: patients.filter((p) => p.has_critical_alert).length,
      insured: patients.filter((p) => !!p.insurance_company_name).length,
    };
  });
