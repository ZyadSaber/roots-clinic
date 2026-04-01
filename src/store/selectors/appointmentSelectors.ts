import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

const selectAppointmentsData = (state: RootState) => state.appointments.data;
const selectAppointmentsFilters = (state: RootState) =>
  state.appointments.filters;
const selectAppointmentsSearchQuery = (state: RootState) =>
  state.appointments.searchQuery;

export const selectFilteredAppointments = createSelector(
  [
    selectAppointmentsData,
    selectAppointmentsFilters,
    selectAppointmentsSearchQuery,
  ],
  (appointments, filters, searchQuery) => {
    return appointments.filter((appointment) => {
      // Search filter
      const searchMatch =
        !searchQuery ||
        appointment.patient_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        appointment.doctor_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        appointment.type.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const statusMatch =
        filters.status === "All" || appointment.status === filters.status;

      // Doctor filter
      const doctorMatch =
        filters.doctor_id === "All" ||
        appointment.doctor_id === filters.doctor_id;

      // Date filter
      const dateMatch =
        !filters.date || appointment.appointment_date === filters.date;

      return searchMatch && statusMatch && doctorMatch && dateMatch;
    });
  },
);
