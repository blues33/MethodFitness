module.exports = function(
  rsRepository,
  eventstore,
  notificationListener,
  notificationParser,
  commands,
  moment,
  logger,
  uuid,
  R
) {
  let fetchAppointment = async function(ctx) {
    logger.debug('arrived at appointment.fetchAppointment');
    const appointments = await rsRepository.getById(ctx.params.appointmentId, 'appointment');
    ctx.status = 200;
    ctx.body = appointments;
  };

  let fetchAppointments = async function(ctx) {
    logger.debug('arrived at appointment.fetchAppointments');
    const trainerClause = ` AND "trainer" = '${ctx.state.user.trainerId}'`;
    const sql = `SELECT * from "appointment" 
      where  "date" >= '${ctx.params.startDate}' 
        AND "date" <= '${ctx.params.endDate}'
        ${ctx.state.user.role !== 'admin' ? trainerClause : ''}`;
    const appointments = await rsRepository.query(sql);
    ctx.status = 200;
    ctx.body = { appointments };
  };

  let scheduleAppointment = async function(ctx) {
    logger.debug('arrived at appointment.scheduleAppointment');
    let payload = ctx.request.body;
    payload.commandName = 'scheduleAppointment';
    const notification = await processMessage(payload, 'scheduleAppointmentFactory', 'scheduleAppointment');
    const result = await notificationParser(notification);

    ctx.body = result.body;
    ctx.status = result.status;
  };

  let scheduleAppointmentInPast = async function(ctx) {
    logger.debug('arrived at appointment.scheduleAppointmentInPast');
    let payload = ctx.request.body;
    payload.commandName = 'scheduleAppointmentInPast';
    const notification = await processMessage(payload, 'scheduleAppointmentFactory', 'scheduleAppointmentInPast');
    const result = await notificationParser(notification);

    ctx.body = result.body;
    ctx.status = result.status;
  };

  let updateAppointment = async function(ctx) {
    try {
      logger.debug('arrived at appointment.updateAppointment');
      let body = ctx.request.body;
      let notification;
      let commandName = '';
      const appointment = await rsRepository.getById(body.appointmentId, 'appointment');
      console.log(`==========body=========`);
      console.log(body);
      console.log(`==========END body=========`);
      console.log(appointment);
      console.log(`==========END appoinment=========`);
      let clientsSame = R.symmetricDifference(body.clients, appointment.clients).length <= 0;
      console.log(`==========clientSame=========`);
      console.log(clientsSame);
      console.log(`==========END clientSame=========`);
      if (
        moment(appointment.date).format('YYYYMMDD') !== moment(body.date).format('YYYYMMDD') ||
        !moment(appointment.startTime).isSame(moment(body.startTime))
      ) {
        commandName += 'rescheduleAppointment';
        body.originalEntityName = appointment.entityName;
      } else if (
        appointment.appointmentType !== body.appointmentType ||
        !clientsSame ||
        appointment.trainerId !== body.trainerId ||
        appointment.notes !== body.notes
      ) {
        commandName += 'updateAppointment';
      } else {
        throw new Error('UpdateAppointment called but no change in appointment');
      }
      body.commandName = commandName;
      notification = await processMessage(body, 'scheduleAppointmentFactory', commandName);
      const result = await notificationParser(notification);

      ctx.body = result.body;
      ctx.status = result.status;
    } catch (ex) {
      ctx.body = { success: false, error: ex.message };
      ctx.status = 500;
    }
  };

  let getWhatChangedOnAppointment = (orig, update, clientSame) => {
    let changes = {};
    if (orig.appointmentType !== update.appointmentType) {
      changes.appointmentType = true;
    }
    if (!clientSame) {
      changes.clients = true;
    }
    if (orig.trainerId !== update.trainerId) {
      changes.trainer = true;
    }
    return changes;
  };

  let updateAppointmentFromPast = async function(ctx) {
    try {
      logger.debug('arrived at appointment.updateAppointmentFromPast');
      let body = ctx.request.body;
      let notification;
      let commandName = '';
      const appointment = await rsRepository.getById(body.appointmentId, 'appointment');
      let clientsSame = R.symmetricDifference(body.clients, appointment.clients).length <= 0;
      if (
        moment(appointment.date).format('YYYYMMDD') !== moment(body.date).format('YYYYMMDD') ||
        !moment(appointment.startTime).isSame(moment(body.startTime))
      ) {
        commandName += 'rescheduleAppointmentFromPast';
        body.originalEntityName = appointment.entityName;
      } else if (
        appointment.appointmentType !== body.appointmentType
        || !clientsSame
        || appointment.trainerId !== body.trainerId
        || appointment.notes !== body.notes
      ) {
        commandName += 'updateAppointmentFromPast';
      } else {
        throw new Error('UpdateAppointmentFromPast called but no change in appointment');
      }
      body.commandName = commandName;
      body.changes = getWhatChangedOnAppointment(appointment, body, clientsSame);
      notification = await processMessage(body, 'scheduleAppointmentFactory', commandName);
      const result = await notificationParser(notification);

      ctx.body = result.body;
      ctx.status = result.status;
    } catch (ex) {
      ctx.body = { success: false, error: ex.message };
      ctx.status = 500;
    }
  };

  let cancelAppointment = async function(ctx) {
    logger.debug('arrived at appointment.cancelAppointment');
    let body = ctx.request.body;

    const notification = await processCommandMessage(body, 'cancelAppointment');
    const result = await notificationParser(notification);

    ctx.body = result.body;
    ctx.status = result.status;
  };

  let removeAppointmentFromPast = async function(ctx) {
    logger.debug('arrived at appointment.removeAppointmentFromPast');
    let body = ctx.request.body;
    body.commandName = 'removeAppointmentFromPast';
    const notification = await processCommandMessage(body, 'removeAppointmentFromPast');
    const result = await notificationParser(notification);

    ctx.body = result.body;
    ctx.status = result.status;
  };

  let processCommandMessage = async function(payload, commandName) {
    return await processMessage(payload, commandName + 'Command', commandName);
  };

  let processMessage = async function(payload, commandFactory, commandName) {
    logger.debug(`api: processing ${commandName}`);
    const continuationId = uuid.v4();
    let notificationPromise = await notificationListener(continuationId);
    const command = commands[commandFactory](payload);
    await eventstore.commandPoster(command, commandName, continuationId);
    return notificationPromise;
  };

  return {
    scheduleAppointment,
    updateAppointment,
    cancelAppointment,
    fetchAppointment,
    fetchAppointments,
    scheduleAppointmentInPast,
    removeAppointmentFromPast,
    updateAppointmentFromPast
  };
};
