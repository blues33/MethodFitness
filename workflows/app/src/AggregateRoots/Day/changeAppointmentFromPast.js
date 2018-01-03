// eslint-disable-next-line camelcase
module.exports = function(eventRepository, pastAppointmentStrategies_array, day, client, sortby, logger) {
  return async function changeAppointmentFromPast(cmd, continuationId) {

    // if orig is not set set it to entityName so equalities will work
    cmd.originalEntityName = cmd.originalEntityName || cmd.entityName;

    let origAppointment;
    if (cmd.originalEntityName !== cmd.entityName || cmd.isPastToFuture) {
      let oldDay = await eventRepository.getById(day, cmd.originalEntityName);
      origAppointment = Object.assign({}, oldDay.getAppointment(cmd.appointmentId));
      oldDay.removeAppointmentFromPast(cmd);

      for (let clientId of origAppointment.clients) {
        let c = await eventRepository.getById(client, clientId);
        logger.debug('refunding client for appointment in past');
        c.returnSessionFromPast(origAppointment.appointmentId);
        logger.info('saving client');
        await eventRepository.save(c, {continuationId});
      }
      await eventRepository.save(oldDay, {continuationId});
    }
    let result = [];
    for (let strategy of pastAppointmentStrategies_array) { // eslint-disable-line camelcase
      if (strategy.evaluate(cmd)) {
        result = await strategy.execute(cmd, origAppointment);
        break;
      }
    }
    for (let r of result.sort(sortby('-type'))) {
      logger.info(`saving ${r.type}`);
      logger.trace(r.instance.state._id);
      await eventRepository.save(r.instance, { continuationId });
    }
  };
};