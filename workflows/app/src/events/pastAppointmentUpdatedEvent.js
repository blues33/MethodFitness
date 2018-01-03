module.exports = function() {
  return function({
    appointmentId,
    appointmentType,
    date,
    startTime,
    endTime,
    trainerId,
    clients,
    notes,
    entityName,
    rescheduled
  }) {
    return {
      eventName: 'pastAppointmentUpdated',
      appointmentId,
      appointmentType,
      date,
      startTime,
      endTime,
      trainerId,
      clients,
      notes,
      entityName,
      rescheduled
    };
  };
};