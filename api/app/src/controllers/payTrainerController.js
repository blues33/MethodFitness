module.exports = function(rsRepository,
                          eventstore,
                          notificationListener,
                          notificationParser,
                          commands,
                          moment,
                          uuid,
                          logger) {
  let fetchVerifiedAppointments = async function(ctx) {
    logger.debug('arrived at payTrainer.fetchVerifiedAppointments');
    try {
      let sql = `SELECT * from "unpaidAppointments" where id = '${ctx.params.trainerId}'`;
      const query = await rsRepository.query(sql);
      const result = query[0];
      let body = {};
      if (result) {
        body = result.unpaidAppointments.filter(x => x.verified);
      }
      ctx.body = body;
      ctx.status = 200;
    } catch (ex) {
      throw ex;
    }
  };

  let payTrainer = async function(ctx) {
    logger.debug('arrived at payTrainer.payTrainer');

    try {
      let payload = ctx.request.body;
      payload.commandName = 'payTrainer';
      payload.datePaid = moment().format('MM/DD/YYYY');
      payload.trainerId = ctx.state.user.id;
      const continuationId = uuid.v4();
      let notificationPromise = notificationListener(continuationId);
      const command = commands.payTrainerCommand(payload);
      await eventstore.commandPoster(command, 'payTrainer', continuationId);

      const notification = await notificationPromise;
      const result = notificationParser(notification);
      ctx.body = result.body;
      ctx.status = result.status;
    } catch (ex) {
      throw ex;
    }
  };

  return {
    fetchVerifiedAppointments,
    payTrainer
  };
};