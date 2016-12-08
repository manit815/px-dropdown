// Extend Polymer.Element base class
class PxDropdown extends Polymer.Element {
  static get is() { return 'px-dropdown'; }
  static get config() {
    return {
      properties: {
        /**
        * A flag which checks if the dropdown trigger has been clicked or not.
        */
        opened: {
          type: Boolean,
          notify: true,
          value: false
        },
        /**
        * A flag which reflects whether the dropdown is being hovered over.
        */
        hover: {
          type: Boolean,
          notify: true,
          value: false
        },
        /**
        * A flag which reflects whether the content is showing above
        * the dropcell. Read-only.
        */
        above: {
          type: Boolean,
          value: false
        },
        /**
        * A flag which reflects whether the chevron should be hidden.
        */
        hideChevron: {
          type: Boolean,
          value: false
        },
        /**
         * An attribute which specifies the bounding target the dropdown will be
         * displayed within.
         */
        boundTarget: {
          type: HTMLElement,
          value: null
        },
        /**
         * An attribute which specifies whether the dropdown will close when
         * outside it. Set to true to prevent dropdown from closing.
         */
        preventCloseOnOutsideClick: {
          type: Boolean,
          value: false
        },
        /**
         * An attribute which specifies what text is displayed on the dropdown
         * When selecting a value from the dropdown content both value and display
         * value will change, with value being set before displayValue.
         */
        displayValue: {
          type: String,
          notify: true,
          value: ''
        },
        _maxCharWidth: {
          type: Number,
          notify: true,
          value: 0
        },
        /**
         * An attribute which specifies the anchor element the content will use to
         * position itself. Won't be used if null.
         */
        contentAnchor: {
          type: HTMLElement,
          value () { return null; }
        },
        /**
         * Reflects the actual value of the dropdown rather than the displayed one
         * (the displayed one can be shortened for example).
         * When selecting a value from the dropdown content both value and display
         * value will change, with value being set before displayValue.
         */
        value: {
          type: String,
          value: '',
          notify: true
        },
        /**
         * After an item has been selected from the dropdown content this represents the
         * key of this item. Empty if no item has been selected yet.
         */
        selectedKey: {
          type: String,
          value: '',
          notify: true
        },
        /**
         * Boolean representing whether the component is active or disabled.
         * When disabled, the user is unable to interact with the dropdown.
         */
        disabled: {
          type: Boolean,
          value: false
        }
      },
      observers: [
        '_boundTargetChanged(boundTarget, isAttached)'
      ]
    }
  }
  constructor() {
    super();
    this.addEventListener('px-dropdown-flip',this._flipOpened.bind(this));
    this.addEventListener('px-dropdown-request-size',this._provideCellSize.bind(this));
    this.addEventListener('px-dropdown-value-changed',this._newTextValue.bind(this));
    this.addEventListener('px-dropdown-max-width',this._newMaxContCharWidth.bind(this));
    
  }
  connectedCallback() {
    super.connectedCallback();
    //capture all clicks so that we can close the dropdown if the user
    //clicks anywhere outside the dropdown
    // Enable document-wide tap recognizer.
    Polymer.Gestures.add(document, 'tap', null);
    // We should be using only 'tap', but this would be a breaking change.
    var tapEvent = ('ontouchstart' in window) ? 'tap' : 'click';
    document.addEventListener(tapEvent, this._onCaptureClick.bind(this), true);

    if(!this.value && this.displayValue) {
      this.set('value', this.displayValue);
    }
  }
  disconnectedCallback(){
    var tapEvent = ('ontouchstart' in window) ? 'tap' : 'click';
    document.removeEventListener(tapEvent, this._onCaptureClick.bind(this));
  } 
  /**
    * This function is called when we have a newly selected value.
    */
    _newTextValue(evt) {
      this.value =  evt.detail.val;
      this.displayValue = evt.detail.val;
      this.selectedKey =  evt.detail.key;

      evt.stopPropagation();
    }
    /**
    * This function is called when we have a maximum character width.
    */
    _newMaxContCharWidth(evt) {
      this._maxCharWidth = evt.detail.maxContCharacterWidth;

      evt.stopPropagation();
    }
    /**
    * This function provide the cell size to the dropdown content.
    */
    _provideCellSize(evt) {
      var dropcell = this.contentAnchor ? this.contentAnchor : this.$.dropcell,
          rect = dropcell.getBoundingClientRect();

      evt.detail.pxContent.dropCellWidth = rect.width;
      evt.detail.pxContent.dropCellHeight = rect.height;

      evt.stopPropagation();
    }
    /**
    * This function checks whether the chevron should be visible or hidden.
    */
    _hideChevron(newValue) {
      // return (!this.hideChevron);
      return true;
    }
    /**
     * Returns whether this dropdown is within the path.
     */
    _selfInPath(path) {
      path = path || [];
      for (var i = 0; i < path.length; i++) {
        if (path[i] === this) {
          return this;
        }
      }
    }
    /**
     * Called whenever a click happens.
     */
    _onCaptureClick(evt) {

      //We're only interested in clicks:
      // - not on ourselves
      // - we're currently open
      if(!this.preventCloseOnOutsideClick &&
         !this._selfInPath(evt.composedPath()) &&
         this.opened) {

        var content = this.querySelector("px-dropdown-content");
        this._flipOpened();
        content.close();
        this._reset();
      }
    }
    /**
    * This function is called when the bound target has changed.
    */
    _boundTargetChanged(boundTarget, isAttached) {
      //find the element if we have been passed an id
      if (typeof boundTarget === 'string') {
        this.boundTarget = this.domHost ? this.domHost.$[boundTarget] :
            this.ownerDocument.querySelector('#' + boundTarget);
      }
    }
    _computeValue(displayValue) {
      return displayValue;
    }
   /**
   * This function is called when the dropdown trigger/chevron is clicked, and
   * it either opens or closes (shows/hides) the content.
   */
    triggerClicked(evt) {
      var content = this.querySelector("px-dropdown-content");
      if(this.disabled) return;
      if (!this.opened) {
        content.open();
        this._setPosition();
      } else {
        content.close();
        this._reset();
      }
      // this.fire('px-dropdown-flip',evt);
      // this.dispatchEvent(new CustomEvent('px-dropdown-flip', {bubbles: true, composed: true}));

    }
    /**
    * This function flips the "opened" property.
    */
    _flipOpened(evt) {
      var chevron = this.shadowRoot.querySelector("px-dropdown-chevron");
      chevron.opened = !chevron.opened;       
      this.opened = !this.opened;

      if(evt) {
        evt.stopPropagation();
      }
    }
    /**
    * This function checks to make sure the chevron exists, and if it does,
    * fire an event.
    */
    // _fireChevron(fireEvent) {
    //   var chevron = this.shadowRoot.querySelector("px-dropdown-chevron");
    //   if (chevron) {
    //     chevron.opened = !chevron.opened; 
    //     chevron.dispatchEvent(new CustomEvent(fireEvent, {bubbles: true, composed: true}));

    //   }
    // }
    /**
    * This function returns the correct class for the chevron
    * depending on the state of the component.
    */
    _dropcellClass(opened, hover, disabled) {
      if (this.opened) {
        return 'opened';
      } else if (this.disabled) {
        return 'disabled';
      } else if (this.hover) {
        return 'hover';
      }
    }
    /**
    * This function returns the correct class for the hideChevrontext
    * depending on the state of the component.
    */
    _disabledClass(disabled) {
      if (this.disabled) {
        return 'disabled';
      }
      else {
        return '';
      }
    }
    /**
    * This function fires off a hoverOn event which px-dropdown-chevron
    * picks up, and sets the hover property to true.
    */
    _hoverOn() {
      /*
      normally, I would have 1 function for both on and off states, and just flip the value of hover
      but IE10 was having issues keeping up with it, so I split it into 2 functions.
      */
      if(!this.disabled) {
        var chevron = this.shadowRoot.querySelector("px-dropdown-chevron");
        chevron.hover = true;    
        this.hover = true;
      }
    }
    /**
    * This function fires off a hoverOff event which px-dropdown-chevron
    * picks up, and sets the hover property to false.
    */
    _hoverOff() {
      /*
      normally, I would have 1 function for both on and off states, and just flip the value of hover
      but IE10 was having issues keeping up with it, so I split it into 2 functions.
      */
      if(!this.disabled) {
        var chevron = this.shadowRoot.querySelector("px-dropdown-chevron");
        chevron.hover = false; 
        this.hover = false;
      }
    }
    /*
     * getter that returns the '#dropdown' in 'px-dropdown-content' 
     */
    get _dropdown(){
      return this.querySelector('px-dropdown-content').shadowRoot.querySelector('#dropdown')
    }
    /**
    * This function resets the above property as well as set
    * the top property to empty string - not 0, which causes firefox to miscalculate.
    */
    _reset() {
      var dropdown = this._dropdown;
      this.above = false;
      dropdown.style.top = '';
    }
    /**
    * This function changes the position of the dropdown content
    * if the content area goes under the viewport.
    */
    _setPosition() {
      this._reset();
      this._positionOnContentAnchor();

      if(this.boundTarget !== null) {
          this.positionWithinBounds(this.boundTarget.getBoundingClientRect());
      } else if (this._isoffScreenOnBottom()) {
        this._setTopPosition();
      }
    }
    /**
    * This function changes the position of the dropdown content
    * to be next to this.contentAnchor rather than the dropcell.
    */
    _positionOnContentAnchor() {
      if(this.contentAnchor) {
        var dropdown = this._dropdown,
            anchorRect = this.contentAnchor.getBoundingClientRect(),
            dropcellRect = this.$.dropcell.getBoundingClientRect();

        dropdown.style.left = (anchorRect.left - dropcellRect.left) + 'px';
        dropdown.style.top = (anchorRect.bottom - dropcellRect.bottom) + 'px';
      }
    }
    /**
    * This function figures out whether the content area for the dropdown is
    * under the viewport.
    */
    _isoffScreenOnBottom() {
      var dropdown = this._dropdown,
          dropdownRect = dropdown.getBoundingClientRect(),
          contentRect = content.getBoundingClientRect(),
          dropdownBottomPoint = dropdownRect.bottom;
      return dropdownBottomPoint > window.innerHeight;
    }
    /**
    * This function appropriately positions the dropdown within the bounds given.
    */
    positionWithinBounds(parentBoundingRect) {
      var dropdown = this._dropdown,
          dropcell = this.contentAnchor ? this.contentAnchor : this.querySelector('#dropcell'),
          dropcellRect = dropcell.getClientRects()[0],
          dropdownRect,
          dropdownBottomPoint,
          sizeAbove,
          sizeBelow;

      //reset content size and get some values
      content.resetHeight();
      dropdownRect = dropdown.getBoundingClientRect();
      dropdownBottomPoint = dropdownRect.bottom,
      sizeAbove = dropdownRect.top - parentBoundingRect.top - parseInt(dropcellRect.height),
      sizeBelow = parentBoundingRect.bottom - dropdownRect.top;

      //if we can't fit it below
      if(dropdownBottomPoint > parentBoundingRect.bottom) {

        //can we fit it above ?
        if(sizeAbove > dropdownRect.height) {
          content.adjustHeight();
          this._setTopPosition();
        } else {

          //fit it where we have the most space
          if(sizeAbove > sizeBelow) {
            content.sizeHeight(sizeAbove - 1);
            this._setTopPosition();
          } else {
            content.sizeHeight(sizeBelow - 1);
          }
        }
      }
    }
    /**
    * This function changes the position of the content area to be above
    * the dropcell, instead of the default below.
    */
    _setTopPosition() {
      var dropdown = this._dropdown,
          dropdownRect = dropdown.getClientRects()[0],
          dropcell = this.contentAnchor ? this.contentAnchor : this.$.dropcell,
          dropcellRect = dropcell.getClientRects()[0],
          newTop = (parseInt(dropdown.offsetTop) - parseInt(dropdownRect.height) - parseInt(dropcellRect.height)) + 'px';

      dropdown.style.top = newTop;
      this.above = true;
    }
  // These are all events that are used by px-dropdown-content, adding them here so they show up in the API document.
  /**
  * Event fired when any given element is selected or deselected in checkboxMode.
  * `evt.detail` contains:
  * ```
  * { val: "text of the changed element",
  *   key: "key of the changed element",
  *   checked: true/false,
  *   items: [the updated items array] }
  * ```
  * @event px-dropdown-checkbox-changed
  */
  /**
  * Event fired when a single element is selected if NOT in checkboxMode.
  * `evt.detail` contains:
  * ```
  * { val: "text of the selected element",
  *   key: "key of the selected element" }
  * ```
  * @event px-dropdown-value-changed
  */
  /**
  * Event fired when an element is clicked  on in the dropdown.
  * @event px-dropdown-click
  */
}

// Register custom element definition using standard platform API
customElements.define(PxDropdown.is, PxDropdown);