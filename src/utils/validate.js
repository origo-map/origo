const validate = {};

validate.integer = (integer) => {
  if (integer) {
    const regex = /^[0-9]*$/;
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
    const regex = /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
  }
  return false;
};

validate.url = (url) => {
  if (url) {
    const regex = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    return regex.test(url);
  }
  return false;
};

validate.datetime = (datetime) => {
  if (datetime) {
    const regex = /^(\d{4,})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/;
    return regex.test(datetime);
  }
  return false;
};

validate.date = (date) => {
  if (date) {
    const regex = /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))/;
    return regex.test(date);
  }
  return false;
};

validate.time = (time) => {
  if (time) {
    const regex = /^(\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/;
    return regex.test(time);
  }
  return false;
};

validate.image = (image) => {
  if (image) {
    const regex = /\.(tiff|pjp|pjpeg|jpe?g|jfif|webp|tif|bmp|png|svgz|gif|svg|ico|xbm|dib)$/i;
    return regex.test(image);
  }
  return false;
};

validate.color = (color) => {
  if (color) {
    const regex = /#([a-f0-9]{3}){1,2}\b/;
    return regex.test(color);
  }
  return false;
};

export default validate;
