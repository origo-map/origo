//import data from './data';
import LayerListStore from './layerliststore';
import readAsync from './readasync';

 const requestAll = () => {
   return data;
 };


const layerRequester = async function layerRequester({
  type = 'all',
  url
}  = {}) {
  if (type === 'all') {
    //LayerListStore.updateList(requestAll());
    let body = `<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:ogc="http://www.opengis.net/ogc" service="CSW" version="2.0.2" resultType="results" startPosition="1" maxRecords="100" outputFormat="application/xml" outputSchema="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:apiso="http://www.opengis.net/cat/csw/apiso/1.0">
  <csw:Query typeNames="csw:Record">
    <csw:ElementSetName>full</csw:ElementSetName>
    <csw:Constraint version="1.1.0">
      <ogc:Filter>
        <ogc:PropertyIsLike matchCase="false" wildCard="%" singleChar="_" escapeChar="\">
          <ogc:PropertyName>csw:anytext</ogc:PropertyName>
          <ogc:Literal></ogc:Literal>
        </ogc:PropertyIsLike>
      </ogc:Filter>
    </csw:Constraint>
  </csw:Query>
</csw:GetRecords> 
`
    let url = "https://karta.eskilstuna.se/geodatakatalogen360/srv/eng/csw"

    const { error, data } = await readAsync(fetch("https://karta.eskilstuna.se/geodatakatalogen360/srv/eng/csw", {
    method: "POST", 
    headers: { "Content-Type" : "application/xml"}, 
    body: body}).then((rsp) => rsp.text()));
    //const { error, data } = await readAsync(fetch(url).then(response => response.json()));
    if (error) {
      console.log(error);
    } else {
      let xml = new DOMParser().parseFromString(data,"text/xml")//.parseFromString(data, "text/html");
      console.log(xml)
      let records = xml.getElementsByTagName("csw:Record");
      let layers = []
      console.log(records)
      for (var i = records.length - 1; i >= 0; i--) {
        let correctUri =  records[i].querySelector(`[protocol='OGC:WMS-1.1.1-http-get-map']`)
        let layerId = correctUri ? correctUri.getAttribute('name') : "No id"
        let title = records[i].getElementsByTagName("dc:title")[0].childNodes[0]
        let description = records[i].getElementsByTagName("dc:description")[0].childNodes[0]
        let theme = "no theme"
        let src = "no src"
        if(correctUri){
          console.log("\n")
          console.log(correctUri)
          if(correctUri.childNodes[0]){
            console.log(correctUri.childNodes[0])
            if(correctUri.childNodes[0].nodeValue){
              console.log(correctUri.childNodes[0].nodeValue)
              src = correctUri.childNodes[0].nodeValue
            }

          }
        }
        
        title = title ? title.nodeValue : "no title"
        description = description ? description.nodeValue : "no desc"
        layers.push({
          layerId,
          title,
          description,
          theme,
          src
        })
      }
      console.log(layers)
      console.log(records[4].getElementsByTagName("dc:title")[0].childNodes[0])
      LayerListStore.updateList(layers);
      //LayerListStore.updateList(data.layers);
    }
  }
  return [];
};

export default layerRequester;