import download from 'downloadjs';

export function simpleExportHandler(simpleExportUrl, activeLayer, selectedItems) {
    if (!simpleExportUrl) {
        alert('Export URL is not specified.');
        return;
    }
    console.log('simple Exporting layer ' + activeLayer.get('name'));

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

export function layerSpecificExportHandler(layerSpecificExportOptions, activeLayer, selectedItems) {
    console.log('spesific Exporting layer ' + activeLayer);
}