/**
 * Created by reharik on 1/15/16.
 */



module.exports = function(eventDispatcher, CommandHandlers_array, eventReceiver) {
  return function() {
    let source = eventDispatcher().startDispatching('command');
    console.log('==========eventReceiver=========');
    console.log(eventReceiver.toString());
    console.log('==========END eventReceiver=========');

    CommandHandlers_array.map(x => eventReceiver(source, x()));
  };
};
