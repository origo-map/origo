export default function imageresizer(imageData, optOptions, orientation, callback) {
  const fileType = imageData.split(';')[0].split('/')[1];
  const options = optOptions;
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const maxSize = options.maxSize || 600;
    let width = image.width;
    let height = image.height;
    let translateWidth;
    let translateHeight;
    let rotation;
    let hScale;
    let vScale;

    if (width > height) {
      if (width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      }
    } else if (height > maxSize) {
      width *= maxSize / height;
      height = maxSize;
    }

    canvas.width = width;
    canvas.height = height;

    switch (orientation) {
      case 1:
        translateWidth = 0;
        translateHeight = 0;
        rotation = 0;
        hScale = 1;
        vScale = 1;
        break;
      case 2:
        translateWidth = 0;
        translateHeight = 0;
        rotation = 0;
        hScale = -1;
        vScale = 1;
        break;
      case 3:
        translateWidth = canvas.width;
        translateHeight = canvas.height;
        rotation = 180;
        hScale = 1;
        vScale = 1;
        break;
      case 4:
        translateWidth = canvas.width;
        translateHeight = canvas.height;
        rotation = 180;
        hScale = -1;
        vScale = 1;
        break;
      case 5:
        canvas.width = height;
        canvas.height = width;
        translateWidth = canvas.width;
        translateHeight = 0;
        rotation = 90;
        hScale = -1;
        vScale = 1;
        break;
      case 6:
        canvas.width = height;
        canvas.height = width;
        translateWidth = canvas.width;
        translateHeight = 0;
        rotation = 90;
        hScale = 1;
        vScale = 1;
        break;
      case 7:
        canvas.width = height;
        canvas.height = width;
        translateWidth = 0;
        translateHeight = canvas.height;
        rotation = 270;
        hScale = -1;
        vScale = 1;
        break;
      case 8:
        canvas.width = height;
        canvas.height = width;
        translateWidth = 0;
        translateHeight = canvas.height;
        rotation = 270;
        hScale = 1;
        vScale = 1;
        break;
      default:
        translateWidth = 0;
        translateHeight = 0;
        rotation = 0;
        hScale = 1;
        vScale = 1;
        break;
    }

    context.translate(translateWidth, translateHeight);
    context.rotate((rotation * Math.PI) / 180);
    context.scale(hScale, vScale);
    context.drawImage(image, 0, 0, width, height);
    const dataUrl = canvas.toDataURL(`image/${fileType}`);
    callback(dataUrl);
  };

  image.src = imageData;
}
