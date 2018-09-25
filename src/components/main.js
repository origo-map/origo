import cu from 'ceeu';

export default function Main(options = {}) {
  const {
    cls: clsSettings = ''
  } = options;

  const cls = `${clsSettings} o-main transparent relative flex grow spacing-vertical-small`.trim();
  const navigation = cu.Element({ cls: 'flex column relative spacing-vertical-small' });
  const mapTools = cu.Element({ cls: 'flex column relative spacing-vertical-small' });
  const miscTools = cu.Element({ cls: 'flex column relative spacing-vertical-small' });
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
                ${bottomTools.render()}
              </div>`;
    }
  });
}
