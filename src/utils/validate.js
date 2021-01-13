const validate = {};

validate.text = (text) => {
  if (typeof text === 'string' || text instanceof String) {
    return text;
  }
  return false;
};

validate.textarea = (textarea) => {
  if (typeof textarea === 'string' || textarea instanceof String) {
    return textarea;
  }
  return false;
};

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
    const regex = /https?:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/i;
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
    const regex = /^(?:2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/;
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

validate.searchList = (input, list) => {
  let isInList = false;
  if (input) {
    const hasValue = list[0].value || false;
    if (hasValue) {
      const test = list.filter(obj => obj.value === input);
      return test.length !== 0;
    }
    list.forEach((obj) => {
      try {
        const { location, extension } = obj;
        const { location: { href } } = document;
        const dir = `${href.substring(0, href.lastIndexOf('/'))}/`;
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET', `${dir + location}/${input}.${extension}`, false); // false for synchronous request
        xmlHttp.send(null);
        const { status } = xmlHttp;
        isInList = status >= 200 && status < 400;
      } catch (error) {
        console.error('error: ', error);
      }
    });
    return isInList;
  }
  return isInList;
};

export default validate;
