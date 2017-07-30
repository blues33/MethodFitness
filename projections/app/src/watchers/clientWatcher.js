module.exports = function(logger) {
  return function(state, persistence, handlerName) {

    async function clientAdded(event) {
      let sanitizeName = name => {
        let _name = name.replace(`'`, `\'`);
        return _name.trim();
      };
      logger.info(`handling clientAdded event in ${handlerName}`);
      const client = {
        id: event.id,
        firstName: sanitizeName(event.contact.firstName),
        lastName: sanitizeName(event.contact.lastName)
      };
      state.innerState.clients.push(client);

      await persistence.saveState(state);
    }

    async function clientContactUpdated(event) {
      logger.info(`handling clientContactUpdated event in ${handlerName}`);
      const subEvent = {
        id: event.id,
        firstName: event.contact.firstName,
        lastName: event.contact.lastName
      };

      state.innerState.clients.map(x =>
        x.id === subEvent.id
          ? subEvent
          : x);
      await persistence.saveState(state);
    }

    return {
      clientAdded,
      clientContactUpdated
    };
  };
};