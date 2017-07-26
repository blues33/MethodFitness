module.exports = function(logger, eventstore, rx, applicationFunctions, mapAndFilterStream) {
  return continuationId => {
    logger.info('startDispatching | startDispatching called');
    const eventAppeared = eventstore.eventEmitterInstance();
    let mAndF = mapAndFilterStream();
    let ef = applicationFunctions.eventFunctions;


    // const subscriptionDropped = (subscription, reason, error) => {
    //   if (error) {
    //     logger.error(error);
    //     logger.error(reason);
    //   }
    //   logger.info('Subscription dropped.');
    // };

    let subscription = eventstore.gesConnection.subscribeToStream(
      'notification',
      false,
      eventAppeared.emitEvent,
      eventstore.subscriptionDropped,
      // subscriptionDropped,
      eventstore.credentials
    );
    logger.info('subscription.isSubscribedToAll: ' + subscription.isSubscribedToAll);

    let stream = rx.Observable
      .fromEvent(eventAppeared.emitter, 'event')
      .first(
        note => {
          return mAndF.continuationId(note).getOrElse() === continuationId &&
          ef.parseData(note).getOrElse().initialEvent.metadata.streamType === 'command';
        })
      .map(note => ef.parseData(note).getOrElse())
      .toPromise();

    return {
      stream,
      subscription
    };
  };
};
