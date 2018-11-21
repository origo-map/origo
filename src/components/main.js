import cu from 'ceeu';

export default function Main(options = {}) {
  const {
    cls: clsSettings = ''
  } = options;

  const cls = `${clsSettings} o-main transparent relative flex column grow height-full no-margin`.trim();
  const navigation = cu.Element({ cls: 'o-navigation flex column relative spacing-vertical-small' });
  const mapTools = cu.Element({ cls: 'o-maptools flex column relative spacing-vertical-small' });
  const miscTools = cu.Element({ cls: 'o-misc flex column relative spacing-vertical-small' });
  const bottomTools = cu.Element({ cls: 'o-tools-bottom absolute bottom-left width-full no-margin' });

  return cu.Component({
    getBottomTools: () => bottomTools,
    getNavigation: () => navigation,
    getMapTools: () => mapTools,
    getMiscTools: () => miscTools,
    render: function render() {
      return `<div id=${this.getId()} class="${cls}">
                <div id="o-tools-left" class="box top-left transparent flex column spacing-vertical-small">
                  ${navigation.render()}
                  ${mapTools.render()}
                  ${miscTools.render()}
                </div>
                <div id="o-tools-bottom" class="box bottom-center transparent width-full ">
                  ${bottomTools.render()}
                </div>
              </div>`;
    }
  });
}
