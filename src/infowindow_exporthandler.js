import download from 'downloadjs';
import replacer from '../src/utils/replacer';


export function simpleExportHandler(simpleExportUrl, activeLayer, selectedItems) {
    if (!simpleExportUrl) {
        alert('Export URL is not specified.');
        return;
    }
    // console.log('simple Exporting layer ' + activeLayer.get('name'));

    /* if (activeLayer.get('type') === 'GROUP') {
        const subLayers = activeLayer.getLayers().getArray();
        const subLayersNames = subLayers.map(l => l.get('name'));
        console.log(subLayersNames);
    } */

    const features = {};
    selectedItems.forEach(item => {
        const layerName = item.getLayer().get('name');
        if (!features[layerName]) {
            features[layerName] = [];
        }
        const obj = item.getFeature().getProperties();
        if (obj.geom) delete obj.geom;
        features[layerName].push(obj);
    });

    fetch(simpleExportUrl, {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(features), // data can be `string` or {object}!
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.blob())
        .then(blob => {
            download(blob, 'ExportedFeatures.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        })
        .catch(err => console.log(err));
}

export function layerSpecificExportHandler(url, activeLayer, selectedItems, attributesToSendToExport) {
    if (!url) {
        alert('Export URL is not specified.');
        return;
    }
    let replacedUrl;
    // console.log('spesific Exporting layer ' + activeLayer.get('name') + url);
    // console.log(attributesToSendToExport);

    const features = {};
    selectedItems.forEach(item => {
        const layerName = item.getLayer().get('name');
        if (!features[layerName]) {
            features[layerName] = [];
        }
        const properties = item.getFeature().getProperties();
        replacedUrl = replacer.replace(url, properties);
        let obj = {};
        if (attributesToSendToExport) {
            attributesToSendToExport.forEach(att => {
                if (att in properties) {
                    obj[att] = properties[att];
                }
            });
        } else {
            obj = properties;
        }
        if (obj.geom) delete obj.geom;
        features[layerName].push(obj);
    });

    return fetch(url, {
        method: 'POST', // or 'PUT'
        body: JSON.stringify(features), // data can be `string` or {object}!
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {            
            switch (response.headers.get('content-type')) {
                case 'application/json':
                    return response.json();

                case 'application/vnd.ms-excel':
                    response.blob().then(blob => {
                        download(blob, 'ExportedFeatures.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    });
                    break;

                default:
                    break;
            }
        })
        .catch(err => console.log(err));
}