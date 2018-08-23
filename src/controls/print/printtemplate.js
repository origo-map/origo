export default obj => `<html>
  <head>
    <link href="css/print.css" rel="stylesheet">
  </head>
  <body>
    <div class="o-print-logo"><img src="${obj.logoSrc}"></div>
    <div class="o-map-canvas"><img src="${obj.src}"/></div>
    <div class="o-print-attribution">${obj.attribution}</div>
  </body>
</html>`;
