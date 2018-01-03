module.exports = function(rsRepository, unpaidAppointmentsState, logger) {
  return function() {

    async function initializeState(initialState) {
      logger.info('Initializing state in unpaidAppointmentsPersistence');
      let state = await rsRepository
        .getAggregateViewMeta('unpaidAppointments', '00000000-0000-0000-0000-000000000001');

      if (!state.trainers) {
        state = initialState;

        await rsRepository.insertAggregateMeta('unpaidAppointments', state);
      }
      return unpaidAppointmentsState(state);
    }

    async function saveState(state, trainerId) {
      logger.info('Saving state in unpaidAppointmentsPersistence');
      let unpaidAppointments = {};
      // have to find out why this is not working
      if (trainerId) {
        unpaidAppointments.unpaidAppointments = state.innerState.unpaidAppointments
          .concat(state.innerState.unfundedAppointments)
          .filter(x => x.trainerId === trainerId);
        unpaidAppointments.trainerId = trainerId;
      }
      return await rsRepository.saveAggregateView(
        'unpaidAppointments',
        state.innerState,
        unpaidAppointments,
      'trainerId');
    }

    return {
      initializeState,
      saveState
    };
  };
};