# Origo plugins
Plugins are to be developed when a feature or function is not appropriate to be included in the origocore. Common reasons are external dependencies or a specific feature or function not requested by the average user. 
## Guidelines development

**[Barebone](https://github.com/origo-map/barebone-plugin)** is an example plugin to provide an initial structure of how you can start developing your plugin. 

Origocore has a lot of dependencies by default which are available to use from the plugins. They should be utilized first before loading more external libraries.

Smaller adjustment to the core might be necessary but should be avoided to make the plugin as standalone as possible. 

## Available plugins
Below is a list of available plugins. More information about each plugin can be found in the plugin's own repository.

Please not that some plugins are third-party plugins that are neither developed nor maintained by Origo.

**[Dialogue](https://github.com/origo-map/dialogue-plugin)**
A simple citizens' dialogue plugin for Origo.

**[Draw](https://github.com/origo-map/draw-plugin)**
A draw tool plugin for simple sketching.

**[Elevation profile](https://github.com/origo-map/elevation-profile-plugin)**
A plugin that shows an elevation profile for linestring features with z-dimension.

**[Geouttag](https://github.com/Eskilstuna-kommun/Geouttag)**
A plugin for geodata export (requires FME Server).

**[Layermanager](https://github.com/origo-map/layermanager)**
A layer manager plugin.

**[LM search plugin](https://github.com/origo-map/lmsearch-plugin)**
Search for Lantmäteriet Direct services via Origoserver API.

**[Multiselect plugin](https://github.com/origo-map/multiselect-plugin)**
Plugin to select features with different methods such as circle, polygon and buffer.

**[OIDC plugin](https://github.com/SigtunaGIS/oidc-plugin)**
A plugin for openid connect authorization with Origo.

**[Swiper plugin](https://github.com/SigtunaGIS/swiper-plugin)**
A plugin to compare two different views.
