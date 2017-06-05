import { connect } from 'react-redux';
import AppointmentForm from '../../components/forms/Appointment/AppointmentForm';
import { scheduleAppointment } from './../../modules/appointmentModule';
import { notifications } from './../../modules/notificationModule';
import appointmentTypes from './../../constants/appointmentTypes';
import { generateAllTimes } from './../../utilities/appointmentTimes';
import { appointmentModel, updateAppointmentModel } from './../../selectors/appointmentModelSelector';
import { updateAppointment, fetchAppointmentAction, deleteAppointment } from './../../modules/appointmentModule';

const mapStateToProps = (state, ownProps) => {
  const isAdmin = state.auth.user.role === 'admin';
  let user = state.trainers.find(x => x.id === state.auth.user.id);

  const clients = state.clients
    .filter(x => !x.archived)
    .filter(x => isAdmin || user.clients.includes(c => c === x.id))
    .map(x => ({value: x.id, display: `${x.contact.lastName} ${x.contact.firstName}`}));

  const trainers = state.trainers
    .filter(x => !x.archived)
    .map(x => ({value: x.id, display: `${x.contact.lastName} ${x.contact.firstName}`}));

  // please put this shit in a config somewhere
  const times = generateAllTimes(15, 7, 7);

  const buttons = ownProps.args.apptId
    ? ['copy', 'delete', 'edit', 'cancel']
    : ['submit', 'cancel'];

  const model = !ownProps.args.apptId
    ? appointmentModel(state, ownProps.args)
    : updateAppointmentModel(state, ownProps.args, ownProps.copy);
  model.appointmentType.label = 'Type';

  return {
    isAdmin,
    model,
    clients,
    trainers,
    appointmentTypes,
    times,
    onCancel: ownProps.onCancel,
    oncopy: ownProps.onCopy,
    buttons,
    editing: !model.id.value
  };
};

export default connect(mapStateToProps, {
  scheduleAppointment,
  updateAppointment,
  fetchAppointmentAction,
  notifications,
  deleteAppointment
})(AppointmentForm);
