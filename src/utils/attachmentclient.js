/*
 * Repository to communicate with an attachment server. The server should be implemented according to ArcGis server attachment services specifications.
 * In addition to the ArcGis specification the server may support optional features if configured with format='origo'
 */

import groupBy from './groupby';

/** Just about anything for creating a dummy group */
const ARCGIS_DEFAULT_GROUP = 'default';
/**
 * Creates an instance of the attachment client using layer's configuration
 * @param {any} layer An OL layer with attachment configuration
 * @returns An object containing the functions that can be performed on the attachmentclient
 */
const attachmentclient = function attachmentclient(layer) {
  const config = layer.get('attachments');
  let stripLayerNameFromId = false;
  const urlbase = config.url;
  // Only strip if using id. If an attribute is used it is not useful
  // It is only to tidy up wfs layers from geoserver
  if ((config.stripLayerNameFromId === undefined || config.stripLayerNameFromId === true) && !config.foreignKey) {
    stripLayerNameFromId = true;
  }
  const layerId = encodeURIComponent(config.layerId || layer.get('id'));
  const format = config.format || 'origo';

  const groups = config.groups.map(group => {
    // ArcGis does not have the concept of groups. Use just any name and assume only one config
    const name = format === 'arcgis' ? ARCGIS_DEFAULT_GROUP : group.name;
    const title = format === 'arcgis' ? null : group.title || group.name;
    return {
      name,
      title,
      linkAttribute: group.linkAttribute,
      fileNameAttribute: group.fileNameAttribute,
      allowedFiles: group.allowedFiles
    };
  });

  /**
   * Gets the configured groups
   * @returns An array of the configured groups
   * */
  const getGroups = function getGroups() {
    return groups;
  };

  /**
   * Internal function for getting id from layer
   * @param {any} feature
   */
  function getId(feature) {
    if (config.foreignKey) {
      return encodeURIComponent(feature.get(config.foreignKey));
    }
    let id = feature.getId();
    if (stripLayerNameFromId) {
      const s = id.split('.');
      id = s.pop();
    }
    return encodeURIComponent(id);
  }

  /**
   * Fetches a list of all attachments for given feature from the server
   * @param {any} feature
   * @returns A promise when resolved yields an array of attachments infos
   */
  const getAttachments = function getAttachments(feature) {
    // Parameter f to get repsonse in json from AGS. Origo format ignores parameter
    const relativeUrl = `${layerId}/${getId(feature)}/attachments?f=json`;
    const url = new URL(relativeUrl, urlbase);

    // Do the actual call to server
    const retval = fetch(url)
      .then(res => res.json())
      .then(res => {
        const allAttachments = new Map();
        if (res.attachmentInfos) {
          let groupedInfos;
          if (format === 'origo') {
            groupedInfos = groupBy(res.attachmentInfos, info => info.group);
          } else {
            // Create a dymmy group for arcgis. It makes everything so much easier later on
            groupedInfos = new Map([[ARCGIS_DEFAULT_GROUP, res.attachmentInfos]]);
          }
          // Create the return value. Create absolute links for each attachment
          groupedInfos.forEach((value, key) => {
            const fixedInfo = value.map(item => {
              const itemRelativeUrl = `${layerId}/${getId(feature)}/attachments/${item.id}`;
              return {
                url: new URL(itemRelativeUrl, urlbase).href,
                id: item.id,
                filename: item.name
              };
            });
            allAttachments.set(key, fixedInfo);
          });
        }
        return allAttachments;
      });
    // No error handling. Let caller deal with that
    return retval;
  };

  /**
   * Posts a new attachment to the server
   * @param {any} feature The feature the attachments belongs to
   * @param {any} file The actual file object
   * @param {any} group Name of the group that the attachment belongs to. Ingored for arcgis.
   * @returns A promise when resolved returns the id of the newly created attachment
   */
  const addAttachment = function addAttachment(feature, file, group) {
    const relativeUrl = `${layerId}/${getId(feature)}/addAttachment`;
    const url = new URL(relativeUrl, urlbase);
    const formData = new FormData();
    // Name "attachment" is in arcgis spec. (and by pure coincident in origo spec.)
    formData.append('attachment', file);
    // Named attribute. Arcgis does not support it
    if (format === 'origo') {
      formData.append('group', group);
    }
    // ArcGis server defaults to html. Origo doesn't care
    formData.append('f', 'json');

    // Perform the actual call
    const retval = fetch(url, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(res => res.addAttachmentResult.objectId);
    // No error handling. Let caller deal with that.
    return retval;
  };
  /**
   * Deletes an attachemnt from the server
   * @param {any} feature The feature that the attachment belongs to
   * @param {any} id Id of the attachment
   * @returns A promise when resolved yields the raw response from the server
   */
  const deleteAttachment = function deleteAttachment(feature, id) {
    const relativeUrl = `${layerId}/${getId(feature)}/deleteAttachments`;
    const url = new URL(relativeUrl, urlbase);

    // Perform the actual request
    return fetch(url, {
      method: 'POST',
      body: new URLSearchParams({
        attachmentIds: id,
        // ArcGis server defaults to html. Origo doesn't care
        f: 'json'
      })
    })
      .then(res => res.json());
    // No error handling let caller deal with that
  };

  // Return all operations on the repository
  return {
    getAttachments,
    addAttachment,
    deleteAttachment,
    getGroups
  };
};

export default attachmentclient;
