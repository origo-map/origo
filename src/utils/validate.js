const validate = {};

validate.integer = (integer) => {
  if (integer) {
    const regex = /^\d+$/;
    return regex.test(integer);
  }
  return false;
};

validate.decimal = (decimal) => {
  if (decimal) {
    const regex = /^\d+(\.\d{1,2})?$/;
    return regex.test(decimal);
  }
  return false;
};

validate.email = (email) => {
  if (email) {
    const regex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
  }
  return false;
};

validate.url = (url) => {
  if (url) {
    const regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
    return regex.test(url);
  }
  return false;
};

export default validate;
