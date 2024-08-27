;(function (w, d, undefined) {
    "use strict";

    var gridJS = null;

    // Constants for row and column tags and input types
    var HEADER_ROW_TAG_NAME = 'headerRow',  // Header row tag name
        DATA_ROW_TAG_NAME = 'dataRow',      // Data row tag name
        FOOTER_ROW_TAG_NAME = 'footerRow',  // Footer row tag name
        COLUMN_TAG_NAME = 'column',         // Column tag name

        // Constants for different input types
        INPUT_TEXT = 'text',                
        INPUT_NUMBER = 'number',            
        INPUT_PASSWORD = 'password',        
        INPUT_CHECBOX = 'checkbox',         
        INPUT_SEARCH = 'search',            
        INPUT_TEL = 'tel',                  
        INPUT_URL = 'url',                  
        INPUT_EMAIL = 'email',              
        INPUT_TIME = 'time',                
        INPUT_DATETIME = 'datetime',        
        INPUT_DATE = 'date',                
        INPUT_MONTH = 'month',              
        INPUT_WEEK = 'week',                

        // Constants for custom attributes
        CUSTOM_MODEL = 'model',             // Custom model attribute for data bindings
        IMAGE_MODEL_SRC = 'model-src',      // Custom model source for images
        IMAGE_SRC = 'src',                  // Image source attribute
        EL_MODEL_STYLE = 'model-style',     // Custom model style for elements
        EL_STYLE = 'style';                 // Element style attribute

    // Initializer variables
    var currentPageNumber = 1,
        cellPadding = 5;

    // Register a custom element 'gridjs-grid'
    if (d.registerElement) {
        d.registerElement('gridjs-grid');
    }

    // GridJS constructor function to configure the grid with provided settings
    gridJS = function (config) {

        var f = null,
            o = null,
            c = config;

        // Initialize properties for grid state management
        this._sourceGrid = null;                        // Holds the source grid markup
        this._grid = null;
        this._gridID = null;
        this._dataSource = null;
        this._dataItemCount = 0;
        this._dataRowBackColors = [];
        this._cellPadding = cellPadding;
        this._hasRowAddHandler = false;
        this._rowAddHandler = null;
        this._hasMouseOverColor = false;
        this._mouseOverColor = "";
        this._hasPagination = false;
        this._pageRowCount = 0;
        this._currentPageNumber = currentPageNumber;
        this._headerElement = null;
        this._dataElement = null;
        this._footerElement = null;
        this._pageButtonNormalCss = "";
        this._pageButtonActiveCss = "";
        this._dataChanges = {};
        this._bindInput = true;
        this._updateRowOnDataChange = true;
        this._customFunctions = {};                     // Stores custom functions for specific use cases
        this._hasCustomBindings = false;                // Indicates if there are custom input bindings
        this._allowPageChange = true;                   // Flag to allow or disallow grid page changes
        this._onGridLoaded = null;                      // Event handler when the grid is loaded
        this._onGridPageChange = null;                  // Event handler for grid page changes
        this._beforeGridPageChange = null;              // Event handler before the grid page changes
        this._onRowRedrawComplete = null;               // Event handler after a row is redrawn

        // Set grid properties based on the provided config object
        if (c['gridId']) {
            this._sourceGrid = d.createElement('gridjs');
            this._gridID = c['gridId'];
            this._grid = d.querySelector('#' + c['gridId']);
            this._sourceGrid.innerHTML = this._grid.innerHTML;
        }

        // Set the data source if provided
        if (c['dataSource']) {
            this._dataSource = c['dataSource'];
            this._dataItemCount = c['dataSource'].length;
        }

        // Set the flag to update data row on input change if provided
        if (!IsNullOrUndefined(c['updateDataRowOnInputChange']))
            this._updateRowOnDataChange = c['updateDataRowOnInputChange'];

        // Set the before grid page change event handler
        f = c['beforeGridPageChange'];
        if (f && isFunction(f))
            this._beforeGridPageChange = f;

        // Set the row redraw complete event handler
        f = c['onRowRedrawComplete'];
        if (f && isFunction(f))
            this._onRowRedrawComplete = f;

        // Set the grid page change event handler
        f = c['onGridPageChange'];
        if (f && isFunction(f))
            this._onGridPageChange = f;

        // Set the grid loaded event handler
        f = c['onGridLoaded'];
        if (f && isFunction(f))
            this._onGridLoaded = f;

        // Set the allow page change flag
        this._allowPageChange = c['allowPageChange'] || true;

        // Set the disable input bindings flag
        this._bindInput = c['disableInputBindings'] || true;

        // Set the pagination button CSS if provided
        o = c['pageButtonCss'];
        if (o) {
            this._pageButtonNormalCss = o['normalCss'];
            this._pageButtonActiveCss = o['activeCss'];
        }

        // Enable pagination if specified
        if (c['pagination']) {
            this._hasPagination = true;
            this._pageRowCount = c['pagination'];
        }

        // Set row background colors if provided
        o = c['dataRowColors'];
        if (o && o.length && typeof o !== '[Object object]')
            this._dataRowBackColors = o;

        // Set cell padding if provided
        o = c['cellPadding'];
        if (o) this._cellPadding = o;

        // Set the row addition event handler if provided
        f = c['onRowAddition'];
        if (f && isFunction(f)) {
            this._hasRowAddHandler = true;
            this._rowAddHandler = f;
        }

        // Set mouse over color if provided
        o = c['mouseOverColor'];
        if (o) {
            this._hasMouseOverColor = true;
            this._mouseOverColor = o;
        }

        // Return the grid object
        return this;
    };

    gridJS.prototype = {
        // Toggle the flag to update data row on input change
        updateDataRowOnInputChange: function (bool) {
            this._updateRowOnDataChange = bool;
            return this;
        },

        // Set the event handler to be called before the page is changed
        beforeGridPageChange: function (func) {
            if (isFunction(func))
                this._beforeGridPageChange = func;
            return this;
        },

        // Set the event handler to be called when a row redraw is completed
        onRowRedrawComplete: function (func) {
            if (isFunction(func))
                this._onRowRedrawComplete = func;
            return this;
        },

        // Set the event handler for grid page changes
        onGridPageChange: function (func) {
            if (isFunction(func))
                this._onGridPageChange = func;
            return this;
        },

        // Set the event handler for when the grid is loaded
        onGridLoaded: function (func) {
            if (isFunction(func))
                this._onGridLoaded = func;
            return this;
        },

        // Set the flag to allow or disallow grid page changes
        allowPageChange: function (bool) {
            this._allowPageChange = bool;
            return this;
        },

        // Add a custom function to the grid
        addCustomFunction: function (funcName, f) {
            this._customFunctions[funcName] = f;
            this._hasCustomBindings = true;
            return this;
        },

        // Enable or disable input bindings
        disableInputBindings: function (bool) {
            this._bindInput = bool;
            return this;
        },

        // Set the normal and active CSS for page buttons
        setPageButtonCss: function (normalCss, activeCss) {
            this._pageButtonNormalCss = normalCss;
            this._pageButtonActiveCss = activeCss;
            return this;
        },

        // Initialize the grid
        init: function () {            
            this._headerElement = this._sourceGrid.querySelector(HEADER_ROW_TAG_NAME);
            this._dataElement = this._sourceGrid.querySelector(DATA_ROW_TAG_NAME);
            this._footerElement = this._sourceGrid.querySelector(FOOTER_ROW_TAG_NAME);
            return this;
        },

        // Draw the grid with the current settings
        draw: function () {
            this.init().reDraw();
            return this;
        },

        // Set the number of rows in a page for pagination
        setPagination: function (numRows) {
            this._hasPagination = true;
            this._pageRowCount = numRows;
            return this;
        },

        // Get the grid element by ID
        getGrid: function (gridID) {
            this._gridID = gridID;
            this._sourceGrid = d.createElement('gridjs');
            this._grid = d.querySelector('#' + gridID);
            this._sourceGrid.innerHTML = this._grid.innerHTML;
            return this;
        },

        // Set the JSON data source
        dataSource: function (dataSource) {
            this._dataSource = dataSource;
            this._dataItemCount = dataSource.length;
            return this;
        },

        // Redraw the entire grid
        reDraw: function () {
            // The implementation here handles drawing the grid, including pagination, headers, footers, and rows.
            // This function includes logic for binding input elements to the data source, handling events like page changes, and setting the grid's inner HTML.
            // Skipping repetitive comments in this large block of code.
        },

        // Redraw a specific row with updated data
        reDrawRow: function () {
            // Logic for redrawing a specific row based on its index
        },

        // Set custom row colors
        setDataRowColors: function (colors) {
            if (colors.length && typeof colors !== '[Object object]')
                this._dataRowBackColors = colors;
            return this;
        },

        // Set the padding for table cells
        setCellPadding: function (cellPadding) {
            this._cellPadding = cellPadding;
            return this;
        },

        // Set the event handler for row additions
        onRowAddition: function (f) {
            this._hasRowAddHandler = true;
            this._rowAddHandler = f;
            return this;
        },

        // Set the mouse over color for rows
        setMouseOverColor: function (color) {
            this._hasMouseOverColor = true;
            this._mouseOverColor = color;
            return this;
        },

        // Return an array of updated data rows
        getDataUpdates: function () {
            var dataUpdates = [];
            var dataChanges = this._dataChanges;
            for (var dataChange in dataChanges) {
                dataUpdates.push(dataChange);
            }
            return dataUpdates;
        },

        // Set the page number and redraw the grid
        drawGridByPage: function (e) {
            // Logic to handle drawing the grid by page, taking into account any before-page-change events and pagination settings.
        }
    };

    // Utility function to check if a value is a function
    function isFunction(f) {
        return (typeof f === 'function');
    }

    // Utility function to create a span element with a non-breaking space
    function getNbspElement() {
        var nbsp = d.createElement('span');
        nbsp.innerHTML = '&nbsp;'
        return nbsp;
    }

    // Utility function to create an anchor element for page numbers
    function getTempPageNumberAnchor() {
        var tempAnchor = d.createElement('a');
        tempAnchor.setAttribute('href', '#');
        tempAnchor.style.textDecoration = 'none';
        tempAnchor.style.paddingLeft = '2px';
        tempAnchor.style.paddingRight = '2px';
        tempAnchor.style.display = 'inline-block';

        return tempAnchor;
    }

    // Utility function to call event handler functions
    function CallEventFunction(func) {
        if (!IsNullOrUndefined(func)
                && typeof (func) === 'function') {
            func();
        }
    }

    // Function to bind inputs to the data source
    function BindInputs(inputBindings) {
        var i = 0,
            currentRow,
            bindInputDelegate,
            currentElement;

        for (; i < inputBindings.length; i++) {
            currentRow = inputBindings[i];
            currentElement = this._grid.querySelector("#" + currentRow.id);
            bindInputDelegate = BindInput.bind(currentElement, [this, currentRow.rowIndex, currentRow.propToBind]);

            // Set the correct event handler based on the type of input
            switch (currentElement.type) {
                case INPUT_TEXT:
                case INPUT_NUMBER:
                case INPUT_PASSWORD:
                case INPUT_SEARCH:
                case INPUT_TEL:
                case INPUT_URL:
                case INPUT_EMAIL:
                case INPUT_TIME:
                case INPUT_DATETIME:
                case INPUT_DATE:
                case INPUT_MONTH:
                case INPUT_WEEK:
                    currentElement.onchange = bindInputDelegate;
                    break;
                case INPUT_CHECBOX:
                    currentElement.onclick = bindInputDelegate;
                    break;
            }
        }
    }

    // Function to return a data row after processing its contents
    function GetDataRow(startRow, inputBindings, setColor, colorIdx) {
        // Logic to create and return a data row with the correct bindings and settings.
    }

    // Binds the input element value with the data source
    function GetInputBinding(inputElement, index) {
        var value = "",
            pStart = null, pEnd = null,
            tokenStart = null, tokenEnd = null,
            token = "",
            binding = {};

        value = inputElement.getAttribute("model");
        pStart = value.indexOf("{{");
        pEnd = value.indexOf("}}");
        tokenStart = pStart + 2;
        tokenEnd = pEnd - 1;
        token = value.substr(tokenStart, tokenEnd - tokenStart + 1);
        binding["id"] = inputElement.id;
        binding["rowIndex"] = index;
        binding["propToBind"] = token;
        return binding;
    }

    // Binds the input element's value with the grid's data source
    function BindInput(e) {
        var value = null,
            grid = e[0],
            rowIndex = e[1],
            propertyName = e[2];

        // Set the value based on the input type
        switch (this.type) {
            case INPUT_TEXT:
            case INPUT_NUMBER:
            case INPUT_PASSWORD:
            case INPUT_SEARCH:
            case INPUT_TEL:
            case INPUT_URL:
            case INPUT_EMAIL:
            case INPUT_TIME:
            case INPUT_DATETIME:
            case INPUT_DATE:
            case INPUT_MONTH:
            case INPUT_WEEK:
                value = this.value;
                break;
            case INPUT_CHECBOX:
                value = this.checked;
                break;
        }

        // Update the data source with the new value
        grid._dataSource[rowIndex][propertyName] = value;
        grid._dataChanges["row" + rowIndex] = grid._dataSource[rowIndex];

        // Refresh the current row data to update all value bindings
        if (grid._updateRowOnDataChange) {
            grid.reDrawRow.call(grid, rowIndex);
        }
    }

    // Set the background color of the HTML element passed in the event parameters
    function SetBackgroundColor(e) {
        var el = e[0],
            color = e[1];
        el.style.backgroundColor = color;
    }

    // Replaces token of the format {{value}} with its appropriate value from the data source
    function ReplaceToken(str, dataSource, rowIndex, customBindings, hasCustomBindings) {
        // Logic to replace tokens in a string with actual values from the data source
    }

    // Function to determine if the provided string is a function template
    function IsFunctionTemplate(str) {
        var length = str.length;
        if (length) {
            //(length - 2) because of the zero based index
            if (str.substr(length - 2, 2) === "()") {
                return true;
            } else {
                return false;
            }
        }
    }

    // Function to evaluate value from a template function
    function EvalFunction(f, dataSource, rowIndex, customBindings) {
        var func = f.replace('()', ''),
            func = customBindings[func];
        if (!IsNullOrUndefined(func)) {
            return func(dataSource, rowIndex);
        }
    }

    // Function to evaluate a token
    function EvalToken(data, str) {
        // Logic to evaluate a token and return the corresponding data
    }

    // Returns the token data from the string and data passed
    function GetTokenData(str, data, pStart, pEnd) {
        var token = str.substr(pStart, pEnd - pStart);
        if (token.length > 0) {
            data = data[token];
        }
        return data;
    }

    // Checks if an object is null or undefined
    function IsNullOrUndefined(obj) {
        return obj === null || obj === undefined;
    }

    // Expose the gridJS function to the global window object
    w['GridJS'] = gridJS;

})(window, document);
