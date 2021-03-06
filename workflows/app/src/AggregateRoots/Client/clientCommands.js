module.exports = function(
  clientInvariants,
  rsRepository,
  eventRepository,
  esEvents,
  uuid,
  logger,
  metaLogger,
) {
  return (raiseEvent, state) => {
    const invariants = clientInvariants(state);
    const generateSessions = cmd => {
      return [].concat(
        addSessions(cmd, 'fullHour'),
        addSessions(cmd, 'halfHour'),
        addSessions(cmd, 'pair'),
      );
    };

    const createNewSessionEvent = (type, purchasePrice, cmd) => {
      return {
        clientId: state._id,
        sessionId: uuid.v4(),
        appointmentType: type,
        purchaseId: cmd.purchaseId,
        purchasePrice,
        createdDate: cmd.createDate,
      };
    };

    const addSessions = (cmd, type) => {
      const individualPrice = cmd[type] ? cmd[`${type}Total`] / cmd[type] : 0;
      const tenPackPrice = cmd[`${type}TenPack`]
        ? cmd[`${type}TenPackTotal`] / (cmd[`${type}TenPack`] * 10)
        : 0;
      let sessions = [];
      for (let i = 0; i < cmd[type]; i++) {
        sessions.push(createNewSessionEvent(type, individualPrice, cmd));
      }
      for (let i = 0; i < cmd[`${type}TenPack`] * 10; i++) {
        sessions.push(createNewSessionEvent(type, tenPackPrice, cmd));
      }
      return sessions;
    };

    return metaLogger(
      {
        addClient: cmd => {
          let cmdClone = Object.assign({}, cmd);
          cmdClone.clientId = cmdClone.clientId || uuid.v4();
          raiseEvent(esEvents.clientAddedEvent(cmdClone));
        },

        updateClientInfo: cmd => {
          let cmdClone = Object.assign({}, cmd);
          invariants.expectNotArchived();
          raiseEvent(esEvents.clientInfoUpdatedEvent(cmdClone));
        },

        updateClientSource: cmd => {
          let cmdClone = Object.assign({}, cmd);
          invariants.expectNotArchived();
          raiseEvent(esEvents.clientSourceUpdatedEvent(cmdClone));
        },

        updateClientContact: cmd => {
          let cmdClone = Object.assign({}, cmd);
          invariants.expectNotArchived();
          raiseEvent(esEvents.clientContactUpdatedEvent(cmdClone));
        },

        updateClientAddress: cmd => {
          let cmdClone = Object.assign({}, cmd);
          invariants.expectNotArchived();
          raiseEvent(esEvents.clientAddressUpdatedEvent(cmdClone));
        },

        archiveClient: cmd => {
          let cmdClone = Object.assign({}, cmd);
          invariants.expectNotArchived();
          raiseEvent(esEvents.clientArchivedEvent(cmdClone));
        },

        unArchiveClient: cmd => {
          let cmdClone = Object.assign({}, cmd);
          invariants.expectArchived();
          raiseEvent(esEvents.clientUnarchivedEvent(cmdClone));
        },

        purchase: async (cmd, trainer) => {
          let cmdClone = Object.assign({}, cmd);
          cmdClone.purchaseId = cmdClone.purchaseId || uuid.v4();
          let sessions = generateSessions(cmdClone);

          // handle unfunded sessions
          let fundedAppointments = [];
          for (let x of state.unfundedAppointments) {
            let session = sessions.find(
              s => s.appointmentType === x.appointmentType && !s.used,
            );
            if (session) {
              const trainerInstance = await eventRepository.getById(
                trainer,
                x.trainerId,
              );
              const TCR = trainerInstance.getTrainerClientRateByClientId(
                state._id,
              );
              let TR = 0;
              if (TCR && session.purchasePrice) {
                TR = session.purchasePrice * ((TCR ? TCR.rate : 0) * 0.01);
              }
              // update appointment for funding event
              x = Object.assign({}, x, {
                sessionId: session.sessionId,
                purchaseId: session.purchaseId,
                pricePerSession: session.purchasePrice,
                trainerPercentage: TCR ? TCR.rate : 0,
                trainerPay: TR,
              });
              // update session to show it's used;
              session.used = true;
              session.appointmentId = x.appointmentId;
              session.trainerId = x.trainerId;
              session.pricePerSession = session.purchasePrice;
              session.trainerPay = TR;
              session.trainerPercentage = TCR ? TCR.rate : 0;
              session.appointmentStartTime = x.appointmentStartTime;
              session.appointmentDate = x.appointmentDate;
              fundedAppointments.push(x);
            }
          }

          cmdClone.sessions = sessions;
          raiseEvent(esEvents.sessionsPurchasedEvent(cmdClone));
          // apply new sessions to unfunded appointments
          fundedAppointments.forEach(e => {
            raiseEvent(esEvents.unfundedAppointmentFundedByClientEvent(e));
          });
        },

        clientAttendsAppointment: async (cmd, trainer) => {
          let cmdClone = Object.assign({}, cmd);
          let event;
          const session = state.clientInventory.consumeSession(cmdClone);
          const trainerInstance = await eventRepository.getById(
            trainer,
            cmdClone.trainerId,
          );

          const TCR = trainerInstance.getTrainerClientRateByClientId(state._id);
          console.log(`==========TCR==========`);
          console.log(TCR);
          console.log(`==========END TCR==========`);

          cmdClone.clientId = state._id;
          cmdClone.clientFirstName = state.firstName;
          cmdClone.clientLastName = state.lastName;
          cmdClone.appointmentDate = cmdClone.date;
          cmdClone.appointmentStartTime = cmdClone.startTime;
          cmdClone.trainerPercentage = TCR ? TCR.rate : 0;
          if (session) {
            const purchasePrice = session.purchasePrice;
            let TR = 0;
            if (TCR && purchasePrice) {
              TR = purchasePrice * (TCR.rate * 0.01);
            }

            cmdClone.sessionId = session.sessionId;
            cmdClone.purchaseId = session.purchaseId;
            cmdClone.pricePerSession = purchasePrice;
            cmdClone.trainerPay = TR;

            event = esEvents.fundedAppointmentAttendedByClient(cmdClone);
          } else {
            event = esEvents.unfundedAppointmentAttendedByClientEvent(cmdClone);
          }

          raiseEvent(event);
        },

        refundSessions: cmd => {
          let cmdClone = Object.assign({}, cmd);
          invariants.expectSessionsExist(cmdClone);
          raiseEvent(esEvents.sessionsRefundedEvent(cmdClone));
        },

        removePastAppointmentForClient: (appointmentId, trainerId) => {
          const unfundedAppointment = state.unfundedAppointments.find(
            u => u.appointmentId === appointmentId,
          );
          if (unfundedAppointment) {
            raiseEvent(
              esEvents.unfundedAppointmentRemovedForClientEvent({
                appointmentId,
                trainerId: unfundedAppointment.trainerId,
                appointmentType: unfundedAppointment.appointmentType,
                clientId: state._id,
              }),
            );
          } else {
            raiseEvent(
              esEvents.fundedAppointmentRemovedForClientEvent({
                appointmentId,
                trainerId,
                clientId: state._id,
              }),
            );
          }
        },

        returnSessionFromPast: appointmentId => {
          const session = state.clientInventory.getUsedSessionByAppointmentId(
            appointmentId,
          );

          if (!session) {
            logger.debug(
              `No session associated with appointment Id: ${appointmentId} found!`,
            );
            return;
          }

          let event;
          const unfundedAppointment = state.unfundedAppointments.find(
            x => x.appointmentType === session.appointmentType,
          );

          if (unfundedAppointment) {
            event = esEvents.sessionTransferredFromRemovedAppointmentToUnfundedAppointment(
              {
                appointmentId: unfundedAppointment.appointmentId,
                clientId: state._id,
                pricePerSession: session.purchasePrice,
                purchaseId: session.purchaseId,
                sessionId: session.sessionId,
                trainerId: session.trainerId,
                trainerPay: session.trainerPay,
                trainerPercentage: session.trainerPercentage,
              },
            );
          } else {
            event = esEvents.sessionReturnedFromPastAppointmentEvent({
              appointmentId,
              sessionId: session.sessionId,
              clientId: state._id,
              appointmentType: session.appointmentType,
            });
          }
          raiseEvent(event);
        },

        updateAppointmentFromPast: cmd => {
          const unfundedAppointment = state.unfundedAppointments.find(
            x => x.appointmentId === cmd.appointmentId,
          );
          if (unfundedAppointment) {
            raiseEvent(esEvents.clientInternalStateUpdatedEvent(cmd));
          }
        },

        getPurchasePriceOfSessionByAppointmentId: appointmentId => {
          const session = state.clientInventory.getUsedSessionByAppointmentId(
            appointmentId,
          );

          return session ? session.purchasePrice : '';
        },
      },
      'ClientCommands',
    );
  };
};
