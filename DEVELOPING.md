# Developing with Origo

## Language
Origo uses JavaScript ECMAScript 6, HTML5 and CSS3. Dependencies to other frameworks shall be avoided. Utilizing other libraries and components are however allowed. The ambition is to use smaller libraries as building blocks rather than building Origo into a big and complex framework such as ExtJS or AngularJS. When using third party libraries or components it is important to ensure that the license is compatible with the license for Origo, see the [license file](LICENSE.txt). 

Origo uses OpenLayers as the map component. Development in Origo shall support versions according to package.json at GitHub. Origo shall support the most commonly used web browsers such as Internet Explorer 11, Edge, FireFox, Chrome and Safari. 

When developing, progressive enhancement is an encouraged strategy. That means that it is allowed to adopt new technology that may not be widely supported today but enhances the user experience in modern web browsers under the condition that the functionality is not critical.

## JavaScript
Origo follows the [Airbnb's JavaScript Style Guide](https://github.com/airbnb/javascript) for EcmaScript 6.

We wish to promote modular development, and in order to do this we have chosen [webpack](https://github.com/webpack/webpack) as the bundler.

Server components are handled separately in the [Origo-server repository](https://github.com/origo-map/origo-server) and are not part of the Origo framework.

## HTML5
Origo uses [Handlebars.js](http://handlebarsjs.com/) as templating system to build more advanced and dynamic HTML pages.

## CSS
The [CSS/SASS guidelines from Airbnb](https://github.com/airbnb/css) shall be followed.

Origo uses SASS to enable modular development of CSS. That means changes and additions to CSS are made in .scss files only. When changes are made it must be verified they are not in conflict with existing css. 

The classes and IDs of CSS selectors shall have the prefix 'o-'.

Icons shall be in SVG format. New icons are preferably chosen from the Material Icons library or secondarily from the Font Awesome library that are available as SVG sprites in Origo. If other libraries are introduced, they shall also be available as SVG sprites.

Origo has a responsive and mobile-friendly design. Development shall follow and work with layouts for existing breakpoints defined in the Origo configuration file. Overall, media queries are not used to define breakpoints since they uses the browser size and not the map size. Instead Origo uses a type to mimic what is usually entitled 'element queries'. Code-wise the breakpoints are defined in a similar way as for media queries but limited to the breakpoints defined in the Origo configuration file.
