let activeClickInteractionControl = 'featureInfo';

const toggleClickInteraction = function toggleClickInteraction(e) {
  const clickInteractionControl = this.getControlByName(e.detail.name);
  if (e.detail.active) {
    const oldClickInteractionControl = this.getControlByName(activeClickInteractionControl);
    oldClickInteractionControl.disableInteraction();
    clickInteractionControl.enableInteraction();
    activeClickInteractionControl = e.detail.name;
  } else {
    clickInteractionControl.disableInteraction();
    const featureinfoControl = this.getControlByName('featureInfo');
    featureinfoControl.enableInteraction();
    activeClickInteractionControl = 'featureInfo';
  }
};

export default toggleClickInteraction;
