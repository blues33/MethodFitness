module.exports = function(eventstore, rsRepository, logger) {
  return async function(eventHandlerName) {
    const rsRepo = await rsRepository;

    let query = `SELECT "commitPosition", "preparePosition"  from "lastProcessedPosition"
     where "handlerType" = '${eventHandlerName}'`;
    const response = await rsRepo.saveQuery(query);
    const row = response.rows[0];
    const commitPosition =
      row && row.commitPosition ? row.commitPosition : null;
    const preparePosition =
      row && row.preparePosition ? row.preparePosition : null;
    const position =
      commitPosition && preparePosition
        ? new eventstore.Position(commitPosition, preparePosition)
        : null;

    logger.info(
      `${eventHandlerName} starting stream @preparePosition:${preparePosition}, @commitPosition:${commitPosition}`,
    );
    return position;
  };
};
