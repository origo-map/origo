const Eventer = function Eventer() {
  const events = {};
  return {
    on: function on(type, listener) {
      const listeners = events[type] || [];
      if (listener) {
        listeners.push(listener);
        events[type] = listeners;
      }
    },
    un: function un(type, listener) {
      const listeners = events[type] || [];
      events[type] = listeners.filter((originalListener => originalListener !== listener));
    },
    dispatch: function dispatch(type, data = {}) {
      const listeners = events[type] || [];
      if (!listeners || listeners.length < 1) {
        return;
      }
      listeners.forEach(listener => listener.call(this, data));
    }
  };
};

export default Eventer;
