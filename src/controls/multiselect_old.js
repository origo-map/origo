
function createFeatureSelectionModal(features) {

  const featuresList = features.map(f => {
    const title = f.get('namn') ? f.get('namn') : f.getId();
    return `<div class="featureSelectorItem" id="${f.getId()}"> ${title} </div>`;
  });

  return new Promise((resolve, reject) => {
    const title = 'Du har valt flera objekt:';
    const content = `<div id="featureSelector"> 
                      ${featuresList.join('')}
                    </div>`;
    modal.createModal('#o-map', {
      title,
      content
    });
    modal.showModal();
    $('.featureSelectorItem').on('click', (e) => {
      bufferFeature = features.find(f => f.getId().toString() === e.target.id).clone();
      console.log(bufferFeature);
      modal.closeModal();
      resolve();
      e.stopPropagation();
    });
  });
}

function createRadiusModal() {
  const title = 'Ange buffer radie:';
  const content = `<div> 
                    <input type="number" id="bufferradius">
                    <button id="bufferradiusBtn">OK</button>
                  </div>`;
  modal.createModal('#o-map', {
    title,
    content
  });
  modal.showModal();
  $('#bufferradiusBtn').on('click', (e) => {
    const radiusVal = $('#bufferradius').val();
    // entered value should only be a number
    // const pattern = /^[0-9]*$/;
    // const onlyNumbers = pattern.test(radiusVal);
    // console.log(onlyNumbers);
    const radius = parseFloat(radiusVal);

    if ((!radius && radius !== 0) || 
        (radius <= 0 && (bufferFeature.getGeometry().getType() === GeometryType.POINT ||
                         bufferFeature.getGeometry().getType() === GeometryType.MULTI_POINT ||
                         bufferFeature.getGeometry().getType() === GeometryType.MULTI_LINE_STRING ||
                         bufferFeature.getGeometry().getType() === GeometryType.LINE_STRING))) {
      $('#bufferradius').addClass('unvalidValue');
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    modal.closeModal();
    // TODO: validating radius(only number, min, max)
    fetchFeatures_Buffer_buffer(radius);
  });
}