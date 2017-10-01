module.exports = function() {
  return function sessionsPurchasedState(state = {}) {
    let innerState = {
      id: state.id || '00000000-0000-0000-0000-000000000001',
      clients: state.clients || [],
      trainers: state.trainers || [],
      appointments: state.appointments || [],
      purchases: state.purchases || []
    };

    const cleanUp = purchase => {
      if (purchase.sessions.every(x => !!x.appointmentId || x.refunded)) {
        purchase.sessions.forEach(x => {
          innerState.appointments = innerState.appointments.filter(a => a.appointmentId !== x.appointmentId);
        });
        innerState.purchases = innerState.purchases.filter(p => p.purchaseId !== purchase.purchaseId);
      }
    };

    const createPurchase = item => {
      return {
        purchaseTotal: item.purchaseTotal,
        purchaseDate: item.purchaseDate,
        purchaseId: item.purchaseId,
        clientId: item.clientId
      };
    };

    const createSessions = item => {
      return item.sessions.map(x => ({
        sessionId: x.sessionId,
        purchaseId: item.purchaseId,
        appointmentId: x.appointmentId,
        appointmentType: x.appointmentType,
        purchasePrice: x.purchasePrice,
        clientId: x.clientId
      }));
    };

    const getPurchase = purchaseId => {
      const purchase = innerState.purchases.find(x => x.purchaseId === purchaseId);
      cleanUp(purchase);
      return purchase;
    };

    const sessionsPurchased = item => {
      const purchase = createPurchase(item);
      purchase.sessions = createSessions(item);
      purchase.sessions.filter(x => x.appointmentId).forEach(session => {
        const appointment = innerState.appointments.find(a => a.appointmentId === session.appointmentId);
        const trainer = innerState.trainers.find(t => t.trainerId === appointment.trainerId);
        session.appointmentDate = appointment.date;
        session.startTime = appointment.startTime;
        session.trainer = `${trainer.firstName} ${trainer.lastName}`;
      });
      innerState.purchases.push(purchase);
    };

    const processFundedAppointment = event => {
      let sessions = innerState.purchases.filter(x => x.clientId === event.clientId)
        .reduce((a, b) => a.concat(b.sessions), []);
      let session = sessions.find(x => x.sessionId === event.sessionId);
      let appointment = innerState.appointments.find(x => x.appointmentId === event.appointmentId);
      let trainer = innerState.trainers.find(x => x.trainerId === appointment.trainerId);

      session.appointmentId = appointment.appointmentId;
      session.appointmentDate = appointment.date;
      session.startTime = appointment.startTime;
      session.trainer = `${trainer.firstName} ${trainer.lastName}`;
      return session.purchaseId;
    };

    const refundSessions = event => {
      let sessions = innerState.purchases.filter(x => x.clientId === event.clientId)
        .reduce((a, b) => a.concat(b.sessions), []);
      let purchaseIds = [];
      event.refundSessions.map(x => {
        let session = sessions.find(y => y.sessionId === x);
        session.refunded = true;
        if (!purchaseIds.includes(session.purchaseId)) {
          purchaseIds.push(session.purchaseId);
        }
      });
      return purchaseIds;
    };

    const returnSessionsFromPastAppointment = (sessionId, purchase) => {
      // purchase coming in is from db row.
      // so if it's been purged, let's re-add it, We'll filter first in case;
      innerState.purchases = innerState.purchases.filter(x => x.purchaseId !== purchase.purchaseId);
      innerState.purchases.push(purchase);
      let session = purchase.sessions.find(x => x.sessionId === sessionId);
      delete session.trainer;
      delete session.startTime;
      delete session.appointmentId;
      delete session.appointmentDate;

      return purchase.purchaseId;
    };

    return {
      getPurchase,
      createSessions,
      createPurchase,
      cleanUp,
      processFundedAppointment,
      sessionsPurchased,
      refundSessions,
      returnSessionsFromPastAppointment,
      innerState
    };
  };
};
