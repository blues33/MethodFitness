module.exports = function appointmentRouter(koarouter, controllers) {
  return function(appRouter) {
    const router = koarouter();
    // having two stacked like this is intentional and allows for optional params
    // secondly this is a get that is actually a post cuz you can't have a body with a get
    /**
     * @swagger
     * /fetchappointments/{startDate}/{endDate}:
     *   post:
     *     x-name: fetchAppointments
     *     description: fetch Appointments
     *     operationId: fetchAppointments
     *     parameters:
     *       - name: startDate
     *         in: path
     *         required: true
     *         description: the beginning of the span of time to retrieve appointments for
     *         type: string
     *       - name: endDate
     *         in: path
     *         required: true
     *         description: the ending of the span of time to retrieve appointments for
     *         type: string
     *     responses:
     *       200:
     *         description: Success
     *         schema:
     *             $ref: "#/definitions/appointmentsResponse"
     *       422:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     *       500:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     */
    /**
     * @swagger
     * /fetchappointments/{startDate}/{endDate}/{trainerId}:
     *   post:
     *     x-name: fetchAppointments
     *     description: fetch Appointments
     *     operationId: fetchAppointments
     *     parameters:
     *       - name: startDate
     *         in: path
     *         required: true
     *         description: the beginning of the span of time to retrieve appointments for
     *         type: string
     *       - name: endDate
     *         in: path
     *         required: true
     *         description: the ending of the span of time to retrieve appointments for
     *         type: string
     *       - name: trainerId
     *         in: path
     *         required: false
     *         description: the trainer id for whom to retrieve appointments
     *         type: string
     *     responses:
     *       200:
     *         description: Success
     *         schema:
     *             $ref: "#/definitions/appointmentsResponse"
     *       422:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     *       500:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     */
    router.post(
      '/fetchappointments/:startDate/:endDate/:trainerId?',
      controllers.appointmentController.fetchAppointments,
    );
    /**
     * /fetchappointment:
     *   get:
     *     x-name: fetchAppointment
     *     description: fetch Appointment by id
     *     operationId: fetchAppointment
     *     parameters:
     *       - name: appointmentId
     *         in: path
     *         required: true
     *         description: The appointment id
     *         type: string
     *     responses:
     *       200:
     *         description: Success
     *         schema:
     *             $ref: "#/definitions/appointment"
     *       422:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     *       500:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     */
    router.get(
      '/fetchappointment/:appointmentId',
      controllers.appointmentController.fetchAppointment,
    );
    /**
     * @swagger
     * /appointment/scheduleappointment:
     *   post:
     *     x-name: /appointment/scheduleAppointment
     *     description: schedule Appointment
     *     operationId: /appointment/scheduleAppointment
     *     parameters:
     *       - name: body
     *         in: body
     *         required: true
     *         schema:
     *           $ref: "#/definitions/scheduleAppointment"
     *     responses:
     *       200:
     *         description: Success
     *         schema:
     *             $ref: "#/definitions/standardSuccessResponse"
     *       422:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     *       500:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     */
    router.post(
      '/appointment/scheduleappointment',
      controllers.appointmentController.scheduleAppointment,
    );
    /**
     * @swagger
     * /appointment/scheduleappointmentinpast:
     *   post:
     *     x-name: /appointment/scheduleAppointmentInPast
     *     description: schedule Appointment in the past
     *     operationId: /appointment/scheduleAppointmentInPast
     *     parameters:
     *       - name: body
     *         in: body
     *         required: true
     *         schema:
     *           $ref: "#/definitions/scheduleAppointment"
     *     responses:
     *       200:
     *         description: Success
     *         schema:
     *             $ref: "#/definitions/standardSuccessResponse"
     *       422:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     *       500:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     */
    router.post(
      '/appointment/scheduleappointmentinpast',
      controllers.appointmentController.scheduleAppointmentInPast,
    );
    /**
     * @swagger
     * /appointment/updateappointment:
     *   post:
     *     x-name: /appointment/updateAppointment
     *     description: update Appointment
     *     operationId: /appointment/updateAppointment
     *     parameters:
     *       - name: body
     *         in: body
     *         required: true
     *         schema:
     *           $ref: "#/definitions/scheduleAppointment"
     *     responses:
     *       200:
     *         description: Success
     *         schema:
     *             $ref: "#/definitions/standardSuccessResponse"
     *       422:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     *       500:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     */
    router.post(
      '/appointment/updateappointment',
      controllers.appointmentController.updateAppointment,
    );
    /**
     * @swagger
     * /appointment/updateappointmentfrompast:
     *   post:
     *     x-name: /appointment/updateAppointmentfrompast
     *     description: update Appointment from past
     *     operationId: /appointment/updateAppointmentfrompast
     *     parameters:
     *       - name: body
     *         in: body
     *         required: true
     *         schema:
     *           $ref: "#/definitions/scheduleAppointment"
     *     responses:
     *       200:
     *         description: Success
     *         schema:
     *             $ref: "#/definitions/standardSuccessResponse"
     *       422:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     *       500:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     */
    router.post(
      '/appointment/updateappointmentfrompast',
      controllers.appointmentController.updateAppointmentFromPast,
    );
    /**
     * @swagger
     * /appointment/cancelappointment:
     *   post:
     *     x-name: /appointment/cancelAppointment
     *     description: cancel Appointment
     *     operationId: /appointment/cancelAppointment
     *     parameters:
     *       - name: body
     *         in: body
     *         required: true
     *         schema:
     *           $ref: "#/definitions/cancelAppointment"
     *     responses:
     *       200:
     *         description: Success
     *         schema:
     *             $ref: "#/definitions/standardSuccessResponse"
     *       422:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     *       500:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     */
    router.post(
      '/appointment/cancelappointment',
      controllers.appointmentController.cancelAppointment,
    );
    /**
     * @swagger
     * /appointment/removeappointmentfrompast:
     *   post:
     *     x-name: /appointment/removeappointmentfrompast
     *     description: remove Appointment that has already past
     *     operationId: /appointment/removeappointmentfrompast
     *     parameters:
     *       - name: body
     *         in: body
     *         required: true
     *         schema:
     *           $ref: "#/definitions/removeAppointmentFromPast"
     *     responses:
     *       200:
     *         description: Success
     *         schema:
     *             $ref: "#/definitions/standardSuccessResponse"
     *       422:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     *       500:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     */
    router.post(
      '/appointment/removeappointmentfrompast',
      controllers.appointmentController.removeAppointmentFromPast,
    );
    /**
     * @swagger
     * /cleanalltestdata:
     *   post:
     *     x-name: cleanAllTestData
     *     description: cleanAllTestData
     *     operationId: cleanAllTestData
     *     responses:
     *       200:
     *         description: Success
     *       422:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     *       500:
     *         description: Failure
     *         schema:
     *             $ref: "#/definitions/standardFailureResponse"
     */
    router.post(
      '/appointment/cleanalltestdata',
      controllers.appointmentController.cleanAllTestData,
    );

    appRouter.use(router.routes(), router.allowedMethods());
  };
};
