export default function createTemplate(localizeFunc) {
  return `<div id="o-editor-toolbar" class="o-editor-toolbar o-toolbar o-toolbar-horizontal o-padding-horizontal-8 o-rounded-top o-hidden">
    <div id="o-editor-toolbar-drawtools" class="o-toolbar-horizontal">
      <div class="o-popover-container">
        <button id="o-editor-draw" class="o-button-lg o-tooltip" style aria-label="${localizeFunc('newObjTooltip')}" type="button" name="button">
          <svg class="o-icon-24">
              <use xlink:href="#ic_add_24px"></use>
          </svg>
          <span data-tooltip="${localizeFunc('newObjTooltip')}" data-placement="north"></span>
        </button>
      </div>
    </div>
    <button id="o-editor-attribute" class="o-button-lg o-tooltip" style aria-label="${localizeFunc('editAttributesTooltip')}" type="button" name="button">
      <svg class="o-icon-24">
          <use xlink:href="#ic_title_24px"></use>
      </svg>
      <span data-tooltip="${localizeFunc('editAttributesTooltip')}" data-placement="north"></span>
    </button>
    <button id="o-editor-delete" class="o-button-lg o-tooltip" style aria-label="${localizeFunc('deleteTooltip')}" type="button" name="button">
      <svg class="o-icon-24">
          <use xlink:href="#ic_delete_24px"></use>
      </svg>
      <span data-tooltip="${localizeFunc('deleteTooltip')}" data-placement="north"></span>
    </button>
        <button id="o-editor-undo" class="o-button-lg o-tooltip" style aria-label="${localizeFunc('undoTooltip')}" type="button" name="button">
      <svg class="o-icon-24">
          <use xlink:href="#ic_undo_24px"></use>
      </svg>
      <span data-tooltip="${localizeFunc('undoTooltip')}" data-placement="north"></span>
    </button>
        <button id="o-editor-redo" class="o-button-lg o-tooltip" style aria-label="${localizeFunc('redoTooltip')}" type="button" name="button">
      <svg class="o-icon-24">
          <use xlink:href="#ic_redo_24px"></use>
      </svg>
      <span data-tooltip="${localizeFunc('redoTooltip')}" data-placement="north"></span>
    </button>
    <div class="o-popover-container">
      <button id="o-editor-layers" class="o-button-lg o-tooltip" style aria-label="${localizeFunc('layerTooltip')}" type="button" name="button">
        <svg class="o-icon-24">
            <use xlink:href="#ic_layers_24px"></use>
        </svg>
        <span data-tooltip="${localizeFunc('layerTooltip')}" data-placement="north"></span>
      </button>
    </div>
     <div class="o-popover-container">
      <button id="o-editor-modifytools" class="o-button-lg o-tooltip o-disabled" style aria-label="${localizeFunc('modifyTooltip')}" type="button" name="button">
        <svg class="o-icon-24">
            <use xlink:href="#ic_edit_24px"></use>
        </svg>
        <span data-tooltip="${localizeFunc('modifyTooltip')}" data-placement="north"></span>
      </button>
    </div>
    <button id="o-editor-abort-session" class="o-button-lg o-disabled o-tooltip" style aria-label="${localizeFunc('revertTooltip')}" type="button" name="button">
      <svg class="o-icon-24">
          <use xlink:href="#ic_cancel_24px"></use>
      </svg>
      <span data-tooltip="${localizeFunc('revertTooltip')}" data-placement="north"></span>
    </button>
    <button id="o-editor-save" class="o-button-lg o-disabled o-tooltip" style aria-label="${localizeFunc('saveTooltip')}" type="button" name="button">
      <svg class="o-icon-24">
          <use xlink:href="#ic_save_24px"></use>
      </svg>
      <span data-tooltip="${localizeFunc('saveTooltip')}" data-placement="north"></span>
    </button>
</div>`;
}
