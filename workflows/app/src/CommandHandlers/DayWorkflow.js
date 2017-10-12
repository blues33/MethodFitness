module.exports = function(eventRepository,
                          changeAppointmentFromPast,
                          logger,
                          day,
                          client,
                          notificationListener,
                          notificationParser) {
  return function DayWorkflow() {
    async function scheduleAppointment(cmd, continuationId) {
      let dayInstance = await scheduleAppointmentBase(cmd);
      let newAppointmentId = dayInstance.getNewAppointmentId(cmd.startTime, cmd.endTime, cmd.trainerId);

      logger.info('saving dayInstance');
      logger.trace(dayInstance.state._id);
      await eventRepository.save(dayInstance, { continuationId });
      return { appointmentId: newAppointmentId };
    }

    async function updateAppointment(cmd, continuationId) {
      logger.info(`calling updateAppointment on Day`);
      let dayInstance = await eventRepository.getById(day, cmd.entityName);
      dayInstance.updateAppointment(cmd);

      logger.info('saving dayInstance');
      logger.trace(dayInstance.state._id);

      await eventRepository.save(dayInstance, { continuationId });
      return { appointmentId: cmd.appointmentId };
    }

    async function cancelAppointment(cmd, continuationId) {
      logger.info(`calling ${cmd.commandName} on Day`);
      let dayInstance = await eventRepository.getById(day, cmd.entityName);
      dayInstance.cancelAppointment(cmd);

      logger.info('saving dayInstance');
      logger.trace(dayInstance.state._id);

      await eventRepository.save(dayInstance, { continuationId });
      return { appointmentId: cmd.appointmentId };
    }

    async function rescheduleAppointment(cmd, continuationId) {
      if (cmd.originalEntityName !== cmd.entityName) {
        return rescheduleAppointmentToNewDay(cmd, continuationId);
      }
      return await updateAppointment(cmd, continuationId);
    }

    async function rescheduleAppointmentToNewDay(cmd, continuationId) {
      cmd.commandName = 'rescheduleAppointmentToNewDay';
      let dayInstance = await scheduleAppointmentBase(cmd);
      let oldDay = await eventRepository.getById(day, cmd.originalEntityName);
      oldDay.cancelAppointment(cmd);
      let newAppointmentId = dayInstance.getNewAppointmentId(cmd.startTime, cmd.endTime, cmd.trainerId);

      logger.info('saving dayInstance');
      await eventRepository.save(dayInstance, { continuationId });

      logger.info('saving OldDay');
      logger.trace(oldDay.state._id);
      await eventRepository.save(oldDay, { continuationId });

      return {
        updateType: 'rescheduleAppointmentToNewDay',
        oldAppointmentId: cmd.appointmentId,
        newAppointmentId
      };
    }

    async function scheduleAppointmentBase(cmd) {
      logger.info(`calling ${cmd.commandName} on Day`);
      let dayInstance = await eventRepository.getById(day, cmd.entityName) || day();
      dayInstance.scheduleAppointment(cmd);
      return dayInstance;
    }

    async function scheduleAppointmentInPast(cmd, continuationId) {
      logger.info(`calling ${cmd.commandName} on Day`);
      let dayInstance = await eventRepository.getById(day, cmd.entityName) || day();
      dayInstance.scheduleAppointmentInPast(cmd);

      logger.info('saving dayInstance');
      logger.trace(dayInstance.state._id);
      let newAppointmentId = dayInstance.getNewAppointmentId(cmd.startTime, cmd.endTime, cmd.trainerId);

      let notificationPromise = await notificationListener(continuationId);
      await eventRepository.save(dayInstance, { continuationId });
      await notificationParser(notificationPromise);

      const newCmd = Object.assign({}, cmd, { appointmentId: newAppointmentId } );
      for (let clientId of newCmd.clients) {
        let c = await eventRepository.getById(client, clientId);
        logger.debug('associating client with appointment from past');
        c.clientAttendsAppointment(newCmd);
        logger.info('saving client');
        await eventRepository.save(c, { continuationId });
      }
      return { appointmentId: newAppointmentId };
    }

    async function rescheduleAppointmentFromPast(cmd, continuationId) {
      logger.info(`calling rescheduleAppointmentFromPast on Day`);
      await changeAppointmentFromPast(cmd, continuationId);
      return {
        updateType: cmd.originalEntityName !== cmd.entityName
          ? 'rescheduleAppointmentToNewDay'
          : '',
        appointmentId: cmd.appointmentId
      };
    }

    async function updateAppointmentFromPast(cmd, continuationId) {
      logger.info(`calling updateAppointmentFromPast on Day`);
      await changeAppointmentFromPast(cmd, continuationId);
      return {appointmentId: cmd.appointmentId};
    }

    async function removeAppointmentFromPast(cmd, continuationId) {
      logger.info(`calling ${cmd.commandName} on Day`);
      let dayInstance = await eventRepository.getById(day, cmd.entityName);
      // first get the appointment so we can refund the client
      const appointment = dayInstance.getAppointment(cmd.appointmentId);
      dayInstance.removeAppointmentFromPast(cmd);

      logger.info('saving dayInstance');
      logger.trace(dayInstance.state._id);
      await eventRepository.save(dayInstance, { continuationId });

      for (let clientId of appointment.clients) {
        let c = await eventRepository.getById(client, clientId);
        logger.debug('refunding client for appointment in past');
        c.returnSessionFromPast(cmd);
        logger.info('saving client');
        await eventRepository.save(c, { continuationId });
      }
      return { appointmentId: cmd.appointmentId };
    }

    return {
      handlerName: 'DayWorkflow',
      scheduleAppointment,
      rescheduleAppointment,
      cancelAppointment,
      updateAppointment,
      scheduleAppointmentInPast,
      removeAppointmentFromPast,
      rescheduleAppointmentFromPast,
      updateAppointmentFromPast
    };
  };
};
