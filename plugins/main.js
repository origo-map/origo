import demoplugin from "./demoplugin/demoplugin.js";

if (import.meta.env.DEV) {
	new demoplugin({
		mySetting: "Demo plugin",
		a: "value",
		b: "value"
	});
}