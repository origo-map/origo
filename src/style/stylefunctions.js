import defaultStyle from './stylefunctions/default';

var customStyles = {
  default: defaultStyle
};

export default function styleFunctions(customStyle, params) {
  if (customStyle in customStyles) {
    return customStyles[customStyle](params);
  } else {
    return customStyles.default(params);
  }
}
