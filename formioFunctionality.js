// Form.io v3.24.4 Helpers
// version 1.0.0 Build: 1
// © Databind, 2021
// https://github.com/databind10
//
// Released under GNU GENERAL PUBLIC LICENSE
// =====================================================================================================================

/**
 * Globals
 */
var global_submitForm = false;
var global_finalTabLabel = "Notes";

// ***************************************************************
// Functionality designed for FormIO Forms and Builder
// ***************************************************************

/**
 * Checks for areas that allow code editing in FormIO. 
 * If code is detected, then add an icon notifying the area that contains code and open it.
 * This is to save developers time from having to check every section that allows code to be entered.
 */
async function CodeCheck() {
    //Widen Editor and resize columns
    $('.formio-dialog.formio-dialog-theme-default .formio-dialog-content').width('90%');
    $('.formio-dialog-content .row:last .col:first').addClass('col-sm-8').removeClass('col-sm-6')
    $('.formio-dialog-content .row:last .col:last').addClass('col-sm-4').removeClass('col-sm-6')

    // Add a code icon to all clickable headings
    $('.component-settings .formio-dialog-content .tab-pane .formio-clickable.card-header').append('<i class="fa fa-code" style="float: right; margin: -15px 0 0 0; color: lightcyan;"></i>');
    await sleep(400);

    // Open all clickable headers so content within them will load
    $(".component-settings .formio-dialog-content .tab-pane .formio-clickable").siblings().css('visibility', 'visible');
    $(".component-settings .formio-dialog-content .tab-pane .formio-clickable").siblings().removeAttr('hidden');
    await sleep(400);

    // Search through each editor
    $('.component-settings .formio-clickable + .card-body .ace_text-layer .ace_line')
        .each(function () {
            // If content is found, change the code icon to green
            if (!$(this).is(':empty')) {
                $(this).parents('div.card-body').prev().find('i.fa').css('color', 'darkgreen');
                //$(this).parents('div.card-body').parents('div.card-body').prev().find('i.glyphicon').removeClass('glyphicon-plus').addClass('glyphicon-minus');
            }
            else // If no content is found, hide (close) the panel
            {
                $(this).parents('div.card-body').css('visibility', 'hidden');
                $(this).parents('div.card-body').attr('hidden', 'true');
                //$(this).parents('div.card-body').prev().find('i.glyphicon').removeClass('glyphicon-minus').addClass('glyphicon-plus');
            }
        });
}

/**
 * Determine if a FormIO Dialog is open or not
 */
function isDialogOpen() {
    var dialog = $('.formio-dialog-content');
    return dialog.length > 0;
}

/**
 * Determine if a ForIO Editor is open or not
 */
function isFormIOEditor() {
    var editor = $('.ui-dialog');
    return editor.length > 0;
}

/**
 * Determine if a validation message is shown
 */
function formIsValid() {
    var errorMsg = $('.is-invalid');
    return errorMsg.length === 0;
}

/**
 * Outputs the current keydown combination in the console
 */
function displayKeyDown() {
    var debug = '';
    debug += 'keyCode: ' + e.keyCode + ' [=] ';
    debug += 'ctrlKey: ' + e.ctrlKey + ' [=] ';
    debug += 'shiftKey: ' + e.shiftKey + ' [=] ';
    debug += 'altKey: ' + e.altKey + ' [=] ';
    debug += 'metaKey: ' + e.metaKey + '';

    logIt('keydown', debug);
}

function FormValidated(form) {
    if (isEmpty(form)) return false;
    form.setPristine(false);
    var isValid = form.checkValidity(form.submission.data);
    var isReallyInvalid = form.checkCurrentPageValidity(form.submission.data, true);
    if (!isValid || !isReallyInvalid) {
        if (isAdmin) {
            notify({
                type: 'error',
                message: 'Please fix the errors before submitting.',
                theme: 'light',
                icon: '<i class="fa fa-wpforms fa-2x"></i>',
                delay: 5000,
                autoHide: true
            });
        }
    }
    else {
        return true;
    }
}

/**
 * Saves the current form that is being edited
 */
function saveForm(e) {
    if (formIsValid()) {
        if (typeof ace !== 'undefined')
            ace.EditSession.prototype.$useWorker = false;

        //Get modal (iframe) info if available
        var modalCount = $(".dialog").length - 1;
        if (modalCount < 0) modalCount = 0;
        var iframe = document.getElementById(`iframe_popUpDialog${modalCount}`);
        var innerDoc = (!isEmpty(iframe)) ? iframe.contentDocument || iframe.contentWindow.document : null;

        if (innerDoc != null && (isDialogOpen() || isFormIOEditor())) {
            if (e != null) e.preventDefault();
            if (isFormIOEditor()) {
                // The FormIo Editor is open
                var notes = $('.page-item SPAN.page-link');
                if (isEmpty(notes)) notes = Array.from(innerDoc.querySelectorAll('.page-item SPAN.page-link'));
                var notesTab = notes.filter(function (index) { return index.textContent === "Notes"; });

                var notesActive = $('.page-item.active SPAN.page-link');
                if (isEmpty(notesActive)) notesActive = Array.from(innerDoc.querySelectorAll('.page-item.active SPAN.page-link'));
                var notesTabSelected = notesActive.filter(function (index) { return index.textContent === "Notes"; });

                if (notesTabSelected.length > 0) {
                    // If the Save Changes tab is selected, then click the Save Button
                    var saveBtn = $('#save');
                    if (isEmpty(saveBtn)) saveBtn = innerDoc.getElementById('save');
                    if (saveBtn.length > 0)
                        saveBtn[0].click();
                    else
                        saveBtn.click();
                }
                else {
                    // If the Save Changed tab is not selected, click the tab
                    if (notesTab.length > 0)
                        notesTab[0].click();
                    else
                        notesTab.click();

                    if (innerDoc != null)
                        $(() => { saveForm(e) });
                }
            }

            if (isDialogOpen()) {
                // If a FormIO Dialog is open, click the Save button
                var save = $('button.btn.btn-success:not(.btn-block)');
                if (isEmpty(save)) save = Array.from(innerDoc.querySelectorAll('button.btn.btn-success:not(.btn-block)'));
                save[0].click();
            }
        }

        // Save the Dashboard Editor
        //if (!isDialogOpen() && !isFormIOEditor() && saveBtn.length > 0) {
        //    if (e != null) e.preventDefault();
        //    saveBtn.click();
        //}
    } else {
        //Cancel submit
        if (e != null) e.preventDefault();
        notify({
            type: 'error',
            message: 'Please correct errors before saving',
            theme: 'light',
            icon: '<i class="fa fa-wpforms fa-2x"></i>',
            delay: 3000,
            autoHide: true
        });
    }
}

/**
 * Overrides Ctrl+s when a FormIO Dialog or FormIO Editor is open, and clicks the Save button, so the user does not have to click the button
 * Also closes FormIO Dialogs with ESC
 */
document.addEventListener("keydown", function (e) {
    //displayKeyDown();

    // ESC closes Dialog Window
    if (e.keyCode == 27) {
        if (isDialogOpen()) {
            var closeBtn = $('.formio-dialog-close');
            if (closeBtn.length > 0)
                closeBtn.click();
        }
    }

    // Ctrl + Shift + c to select the Content tab in the editor
    if (e.keyCode == 67 && e.altKey && e.ctrlKey) {
        if (isFormIOEditor()) {
            console.log('click it');
            var contentBtn = $('span.page-link:contains("Content")');
            if (contentBtn.length > 0)
                contentBtn.click();
        }
    }

    //CTRL key + s to Save the current content
    if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        var modalCount = $(".dialog").length - 1;
        if (modalCount < 0) modalCount = 0;
        if (modalCount == 0)
            parent.saveForm(e);
        else
            saveForm(e);
    }
}, false);

/**
 * Gets the DOM item with the provided component name
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {text} componentName      Component Name to be searched for
 */
function getRootComponent(instanceRoot, componentName) {
    var results = [];
    try {
        var componentResult = instanceRoot.getComponent(componentName);
        if (componentResult != null) {
            results = componentResult;
        }
    }
    catch (e) {
        //Do Nothing
    }
    return results;
}

/**
 * Gets the value of the DOM item with the provided component name
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {bool} parseJson          If true, parse the JSON response
 * @param {text} componentName      Component Name to be searched for
 */
function getRootComponentValue(instanceRoot, parseJson, componentName) {
    var results = [];
    try {
        var jsonResults = instanceRoot.getComponent(componentName);
        if (jsonResults != null && jsonResults.value != '') {
            results = (parseJson) ? JSON.parse(jsonResults.value) : jsonResults.value;
        }
    }
    catch (e) {
        //Do Nothing
    }
    return results;
}

/**
 * Global Property Replacement
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {bool} parseJson          If true, parse the JSON response
 * @param {text} componentName      Component Name to be searched for
 * @param {text} path               JSONPath syntax. Example: $.phoneNumbers[:1].type
 */
function getRootComponentContent(instanceRoot, parseJson, componentName, path) {
    var results = [];
    try {
        var data = getRootComponent(instanceRoot, componentName);
        if (data != null && !data.component.content.includes("~[")) {
            if (parseJson) {
                var jsonStr = (isJsonString(data.component.content) && typeof data.component.content !== 'object') ? JSON.stringify(JSON.parse(data.component.content), null, '\t') : JSON.stringify(data.component.content, null, '\t');
                var json = JSON.parse(jsonStr);
                results = (path != '') ? jsonPath(json, path) : json;
            }
            else {
                results = data.component.content;
            }
        }
    }
    catch (e) {
        //Do Nothing
    }
    return results;
}

/**
 * Gets results from an API call
 * @param {int} version             API Version: v1=Data Proxy, v2=RestSharp
 * @param {bool} url                The URL to the API
 * @param {bool} body               Parameters to pass to the API
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {text} componentName      The FormIO component name to set the value to the API results
 */
function getAPIResults(version, url, body, instanceRoot, componentName) {
    loading('Fetching Results...', 'Please Wait...');
    return fetch(url, body, {
        headers: global_fetchHeaders
    }).then((response) => {
        try {
            var comp = instanceRoot.getComponent(componentName);
            response.json().then((data) => {
                if (data != '') {
                    var returnHeadersOnly = (!isEmpty(body) && body.headersOnly === true);
                    var json = (isJsonString(data) && typeof data !== 'object') ? JSON.stringify(JSON.parse(data), null, '\t') : JSON.stringify(data, null, '\t');
                    if (returnHeadersOnly)
                        json = (isJsonString(data) && typeof data !== 'object') ? JSON.stringify(JSON.parse(data)) : JSON.stringify(data); //don't format the headers

                    if (response.status == 200) {
                        success = (response.statusText == 'OK' || isEmpty(response.statusText));
                        var apiVersion = parseInt(version);
                        switch (apiVersion) {
                            case 2:
                                if (returnHeadersOnly)
                                    comp.setValue('[' + getJSONKeys(true, json) + ']');
                                else
                                    comp.setValue(json);
                                break;
                            default:
                                comp.setValue(json);
                                break;
                        }
                    }
                    else {
                        comp.setValue("Error: " + json);
                    }
                }
                loadingStop();
            });
        }
        catch (e) {
            loadingStop();
        }
    });
}

/**
 * Translate &#45 to ~ in the API call body from within a DC or Form
 * @param {text} version    API Version: v1=Data Proxy, v2=RestSharp
 * @param {text} json       Parameters to pass to the API
 * @param {text} from       Target to replace
 * @param {text} to         Value to replace target with
 */
function apiFormTranslateToTilde(version, json, from, to) {
    if (json != null && json != undefined) {
        var body = JSON.parse(json);
        switch (version) {
            case '2':
                if (body['URI'] !== undefined)   
                    body['URI'] = body['URI'].replace(from.replace(/&#45/g, '~'), to);
                return body;
                break;
            default:
                body['returnHeaders'] = body['headersOnly'];
                body['uri'] = body['uri'].replace(from.replace(/&#45/g, '~'), to);
                return body;
                break;
        }
    }
}

/**
 * Set the value of a component
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {text} componentName      The FormIO component name to set the value to
 * @param {text} value              A string to set the component value to
 */
function setRootComponentValue(instanceRoot, componentName, value) {
    try {
        var componentResult = instanceRoot.getComponent(componentName);
        if (componentResult != null) {
            componentResult.setValue(value);
        }
    }
    catch (e) {
        //Do Nothing
    }
}

/**
 * Set a value of a component in a grid
 * @param {object} instance         The current instance of the FormIO form
 * @param {text} parentName         The parent name of the component
 * @param {text} childName          The child name of the component
 * @param {text} value              A string to set the component value to
 */
function setRootChildComponentValueByRow(instance, parentName, childName, value) {
    try {
        var parentRow = getRowNumber(instance);
        var componentResult = instance.root.getComponent(parentName);
        if (componentResult != null) {
            var dg = componentResult.components[parentRow].getComponent(childName);
            if (!isEmpty(dg)) {
                dg.setValue(value);
            }
        }
    }
    catch (e) {
        //Do Nothing
    }
}

/**
 * Get a value of a component in a grid
 * @param {object} instance         The current instance of the FormIO form
 * @param {text} parentName         The parent name of the component
 * @param {text} childName          The child name of the component
 */
function getRootChildComponentValueByRow(instance, parentName, childName) {
    var comp;
    try {
        var parentRow = getRowNumber(instance);
        var componentResult = instance.root.getComponent(parentName);
        if (componentResult != null) {
            comp = componentResult.components[parentRow].getComponent(childName);
        }
    }
    catch (e) {
        //Do Nothing
    }
    return comp;
}

/**
 * Find the select component by the data value in order to retrieve additional property values
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {text} componentName      The FormIO component name to retrieve the value from
 * @param {text} value              The string value to match
 */
function getSelectedValuesByData(instanceRoot, componentName, value) {
    var results = [];
    try {
        var root = getRootComponent(instanceRoot, componentName);
        if (!isEmpty(root)) {
            var found = root.component.data.values.find((e) => {
                return e.value == value;
            });
            results = found;
        }
    }
    catch (e) {
        //Do Nothing
    }
    return results;
}

/**
 * Find the select component by the data value in order to retrieve additional property values (API downloaded values)
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {text} componentName      The FormIO component name to retrieve the value from
 * @param {text} key                The object key holding the values to match
 * @param {text} value              The string value to match
 */
function getSelectedValuesByDownloadedData(instanceRoot, componentName, key, value) {
    var results = [];
    try {
        var root = getRootComponent(instanceRoot, componentName);
        if (!isEmpty(root)) {
            var found = root.defaultDownloadedResources.find((e) => {
                return e[key] === value;
            });
            results = found;
        }
    }
    catch (e) {
        //Do Nothing
    }
    return results;
}

/**
 * Click a button to apply custom logic and functionality
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {text} buttonName         Id of the button to click
 */
function applyCustomLogic(instanceRoot, buttonName) {
    try {
        var button = getRootComponent(instanceRoot, buttonName);
        if (button != null) {
            button.buttonElement.click();
        }
    }
    catch (e) {
        //Do Nothing
    }
}

/**
 * Tab permissions on Wizard form
 * @param {text} formDataId     Id declared in JavaScript on the form page
 * @param {array} allowedRoles  JSON Array [ "1", "2", "3" ]
 * @param {array} currentRoles  The role(s) of the logged in user
 */
function checkFormSubmissionAndValidateRole(formDataId, allowedRoles, currentRoles) {
    var formHasBeenSubmitted = validateGuid(formDataId);
    var result = false;
    if (formHasBeenSubmitted && !isEmpty(allowedRoles) && !isEmpty(currentRoles)) {
        var roles = [];
        if (typeof currentRoles !== "object")
            if (currentRoles.indexOf(',') > -1) {
                $.each(currentRoles.split(','), function (index, value) {
                    roles.push(value.replace(/"/g, "").trim());
                });
            }
            else
                roles.push(currentRoles.replace(/"/g, "").trim());
        else
            roles = currentRoles;

        for (var r = 0; r < roles.length; r++) {
            result = allowedRoles.map(function (r) {
                return r.toLowerCase();
            }).indexOf(roles[r].toLowerCase()) >= 0;
            if (result) break;
        }
    }
    return result;
}

/**
 * Validate the UserId is not empty or equal to a blank GUID
 * @param {text} guid     Guid to validate
 */
function validateGuid(guid) {
    return (guid != '00000000-0000-0000-0000-000000000000' && guid != '');
}

/**
 * Wizard page index starts with 0
 * Use this to show a submit button if the next page is undefined
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {number} pageIndex        Index of the wizard page
 */
function wizardPageNotAvailable(instanceRoot, pageIndex) {
    if (instanceRoot.pages != undefined) {
        var page = instanceRoot.pages[pageIndex];

        return (page == undefined);
    }
    else {
        return true;
    }
}

/**
 * Shows/Hides a Wizard Button
 * @param {bool} checkBoolValue     If true, the Wizard button is shown
 */
function toggleWizardSubmit(checkBoolValue) {
    if (checkBoolValue == 'true') {
        $('.btn-wizard-nav-submit').show();
    } else {
        $('.btn-wizard-nav-submit').hide();
    }
}

/**
 * Clears the content of a DOM object
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {text} component          ID of the DOM object to clear
  *
 * TODO: Check if this is used : Delete?
*/
function clearContents(instanceRoot, component) {
    var textArea = getRootComponent(instanceRoot, component);
    if (textArea != null) {
        textArea.setValue('');
    }
}

/**
 * Submit the FormIO form via code using the code of a button
 * @param {text} formId                 The GUID of the form
 * @param {text} siteUri                The current site URI
 * @param {text} redirect               The URI to redirect the site after submitting the form
 * @param {text} isAdmin                Check to see if the user is logged into the admin section
 * @param {text} refreshId              A dashboard GUID to refresh if a form was opened from within a DC
 * @param {text} incrementerSessionKey  A form incrementer key name. Primarily used as a unique identifier for a form such as a timesheet
 */
function finalizeFormSubmission(formId, siteUri, redirect, isAdmin, refreshId, incrementerSessionKey) {
    if (!isEmpty(global_submitForm)) global_submitForm = false;
    var arr = {
        message: 'Your form was successfully submitted. Thanks!',
        returnUrl: siteUri + '/Forms/Index/' + formId,
        returnUrlMessage: 'Fill out another form',
        sessionKey: incrementerSessionKey
    };
    //todo: refactor fetch related properties into a separate method
    var postBody = {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: global_fetchHeaders,
        body: JSON.stringify(arr) // body data type must match "Content-Type" header
    }

    if (redirect !== '') {
        //This will clear the incrementer indirectly
        fetch('/Forms/Thanks', postBody);
        parent.location.href = redirect;
    }
    else {
        if (isAdmin) {
            //This will clear the incrementer indirectly
            fetch('/Forms/Thanks', postBody);
            parent.notify({
                type: 'success',
                message: 'Form successfully submitted',
                theme: 'light',
                icon: '<i class="fa fa-wpforms fa-2x"></i>',
                delay: 3000,
                autoHide: true,
                position: {
                    x: 'center',
                    y: 'center'
                }
            });
            var modalCount = $('.dialog').length - 1;
            if (refreshId != '' && modalCount == 0) {
                parent.refreshDCAsync(refreshId, 'false', 'true', '');
            }
            parent.closeModal();
            //This form is viewed in the admin section without a modal
            if (modalCount < 0) {
                arr.returnUrl = siteUri + '/Forms/Admin/' + formId,
                redirectPost('/Forms/AdminThanks', arr);
            }
        }
        else {
            //This will clear the incrementer directly
            redirectPost('/Forms/Thanks', arr);
        }
    }
}

/**
 * Get ACE editor errors from within a FormIO form
 * @param {object} component        FormIO component that hold the editor
 * @param {bool} errorOnWarning     Throw an error if there is a warning present
 */
function getAceEditorErrors(component, errorOnWarning) {
    var hasError = false;
    hasError = (component.input.innerHTML.indexOf('ace_error') < 0);
    if (errorOnWarning == true) {
        hasError = (textArea.input.innerHTML.indexOf('ace_warning') < 0);
    }
    return hasError;
}

/**
 * Checks if the form information contains errors to prevent a user from leaving the tab
 * @param {text} text           Text to search for within the tabs
 * @param {bool} isValid        Is the form valid
 * @param {object} instance     Dom object
 * @param {text} label          Test to set the label of the instance component if the form is valid
 */
function clickTab(text, isValid, instance, label) {
    if (isValid) {
        var tabs = $('.pagination .page-item .page-link');
        var result = $.grep(tabs, function (v) {
            return v.innerHTML === text;
        });
        var tab = result[0].closest('.page-item');
        //reset label
        instance.label = label;
        instance.redraw();
        //if page is valid, go to the last tab so you can save the changes
        if (tab != null) {
            result[0].closest('.page-item').click();
        }
    }
    else {
        updateButtonLabel(instance, 'Please fix the errors highlighted in red', 'btn btn-danger');
    }
}

/**
 * Updates the label and classes of a button
 * @param {object} instance     Button to update
 * @param {text} label          Label to put on the button
 * @param {text} classes        Classes to add to the button
 */
function updateButtonLabel(instance, label, classes) {
    if (!isEmpty(instance)) {
        instance.label = label;
        instance.redraw();
        $('#' + instance.key).removeClass();
        $('#' + instance.key).addClass(classes);
    }
}

/**
 * Get the Quill editor content from within a FormIO form
 * @param {object} instance     FormIO instance that contains the Quill editor
 */
function getQuillContent(instance) {
    if (!isAdminBuilder) {
        if (!isEmpty($('.ql-editor')[0])) {
            var encodedStr = $('.ql-editor')[0].innerHTML;
            if (!isEmpty(encodedStr)) {
                var decodedStr = document.createElement('textarea');
                decodedStr.innerHTML = encodedStr;
                if (!isEmpty(decodedStr.value)) {
                    instance.setValue(decodedStr.value);
                }
            }
        }
    }
}

/**
 * Gets the HTML of an object. Primarily used to show HTML content of an already submitted form
 * Sometimes the HTML gets encoded and makes the markup hard to read and you lose the formatting
 * This function resets the HTML back to the original state
 * @param {object} instance  FormIO instance that contains the HTML you are looking for
 * @param {text} content     The original HTML content
 */
function getHtmlContent(instance, content) {
    if (!isAdminBuilder) {
        var decodedStr = document.createElement('textarea');
        decodedStr.innerHTML = content;
        if (!isEmpty(decodedStr.value)) {
            instance.component.content = decodedStr.value;
            instance.redraw();
        }
    }
}

/**
 * Determines if the current page is in Viewer mode
 */
function isFormViewer() {
    var isViewer = rawUri.toLowerCase().indexOf('/viewer/') != -1;
    if (!isViewer) {
        isViewer = rawUri.toLowerCase().indexOf('/adminviewer/') != -1;
    }
    return isViewer;
}

/**
 * Get row number in a DataGrid, EditGrid, and Container
 * @param {object} instance    FormIO instance that contains a grid
 */
function getRowNumber(instance) {
    var row = 0;
    if (!isAdminBuilder && !isEmpty(instance)) {
        row = (!isEmpty(instance.row)) ? parseInt(instance.row.split('-')[0]) : 0;
    }
    return row;
}

/**
 * Get the row number based on the component name attribute
 * Example: data[questionsDataGrid][2][answers][1][button]
 * Return the selected number by index [ 2, 1 ]
 * @param {text} nameAttr   HTML name attribute 
 * @param {number} index    Row index
 */
function getRowNumberByIndex(nameAttr, index) {
    var result = 0;
    if (!isEmpty(nameAttr) && !isEmpty(index)) {
        var arr = /\[[0-9]*?\]/.exec(nameAttr);
        if (!isEmpty(arr)) {
            var i = parseInt(index);
            var a = arr[i];
            result = a.slice(a.indexOf('[') + 1, a.indexOf(']'));
        }
    }
    return result;
}

/**
 * FormIO FileSelector Camera Icon does not work in Apple Mobile
 */
function removeCameraIconInMobile() {
    if (isMobile()) {
        setTimeout(() => {
            var icon = $('.fileSelector:last .glyphicon.glyphicon-cloud-upload:last');
            var browse = $('.fileSelector:last .browse:last');
            var fs = $('.fileSelector');
            fs.empty();
            fs.append(icon);
            fs.append(' Drop files to attach, or ');
            fs.append(browse);
        }, 500);
    }
}

/**
 * Check to see if the current tab is selected on a Formio wizard form
 * @param {text} tabName   Name of the tab
 */
function isTabSelected(tabName) {
    if (isEmpty(tabName)) return false;

    var selectedText = $('.page-item.active SPAN.page-link');
    if (selectedText.length > 0) {
        return tabName === selectedText.text();
    }
    return false;
}

/**
 * Remove all of the error notifications from the form
 */
function clearFormErrors() {
    $('.help-block').remove();
    $('.alert.alert-danger').not('.has-error').remove();
}

/**
 * Check to see if the current form is valid
 * REQUIRED: hidden form component named validationResponse
 * @param {text} callback   name of the function to call when call is done
 * @param {object} form     form instance (JSON)
*/
function checkIfFormIsValid(callback, form) {
    clearFormErrors();
    var errors = form.showErrors(null, !0);
    var hasErrors = (!isEmpty(errors)) ? errors.length > 0 : false;
    form.dataReady.then(function () {
        //Forces the form to remove errors when fixed
        form.checkValidity(form.submission.data);
        //REQUIRED to trigger a validation by making a change
        setRootComponentValue(form, 'validationResponse', `Has Errors: ${hasErrors}`);
        //Call the next function and pass whether there are any validation errors
        callback(!hasErrors);
    });
}

/**
 * The Fomio file component link is broken. Fix the URL for each uploaded file
 * @param {text} gridComponent  Grid component holding the files component
 * @param {text} fileComponent  File component holding the array of files
 * @param {object} data         form submission data
 * @param {text} uploadsPath    full path to the uploads directory
*/
function updateFormioFileLinks(gridComponent, fileComponent, data, uploadsPath) {
    if (!isEmpty(fileComponent)) {
        var fileCompName = fileComponent.key;
        if (!isEmpty(fileCompName)) {
            if (!isEmpty(gridComponent)) {
                var dg = data[gridComponent.key];
                for (var i = 0; i < dg.length; i++) {
                    var obj = dg[i][fileCompName][0];
                    updateFormioFileLink(obj, uploadsPath)
                }
            }
            else {
                var fc = data[fileComponent.key];
                updateFormioFileLink(fc, uploadsPath)
            }
        }
    }
}

/**
 * The Fomio file component link is broken. Fix the URL for an uploaded file
 * @param {object} dataObj      Data object of the uploaded file
 * @param {text} uploadsPath    full path to the uploads directory
*/
function updateFormioFileLink(dataObj, uploadsPath) {
    if (!isEmpty(dataObj)) {
        var link = dataObj.url;
        var file = link.substring(link.lastIndexOf('/') + 1);
        dataObj.url = `${uploadsPath}/${file}`;
    }
}

/**
 * Set coordinates in a latitide and longitude component on a form
 * This requests if the website has access to your location
 * @param {object} instanceRoot     The root instance of the FormIO form
 */
function getGeoLocation(instanceRoot) {
    getGeoLocationCoords(updateComponents);

    function updateComponents(coords) {
        if (!isEmpty(coords) && isEmpty(coords.error)) {
            setTimeout(function () {
                setRootComponentValue(instanceRoot, 'latitude', coords.latitude);
                setRootComponentValue(instanceRoot, 'longitude', coords.longitude);
            }, 1000);
        }
    }
}

/**
 * Hide the text in a label. but not any of the other components
 * This is so you can see the tooltip without a label
 * @param {object} instance     The  instance of the FormIO form component
 */
function removeLabelText(instance) {
    if (!isEmpty(instance)) {
        var label = $('label[for="' + instance.component.key + '"]');
        label.contents().filter(function () {
            return (this.nodeType == 3);
        }).remove();
    }
}

/**
 * If the fetch call in a form submission fails, provide the error message and notify the user
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {string} message          The message returned from the API
 * @param {string} apiResponseId    The FormIO form component to display the message to the user
 * @param {bool} isAdmin            flag provided by the form to determin if the form is in the admin section
 */
function formSubmissionAPIFailure(instanceRoot, message, apiResponseId, isAdmin) {
    if (!isEmpty(message) && !isEmpty(apiResponseId)) {
        var textArea = getRootComponent(instanceRoot, apiResponseId);
        if (textArea !== null) {
            var errorMsg = `Submission failed. Please try again. Error: ${message}`;
            if (textArea.component !== null)
                textArea.component.content = errorMsg;
            textArea.redraw();
            if (isAdmin) {
                notify({
                    type: 'error',
                    message: errorMsg,
                    theme: 'light',
                    icon: '<i class="fa fa-wpforms fa-2x"></i>',
                    delay: 5000,
                    autoHide: true
                });
            }
        }
    }
}

/**
 * Enable/Disable a formio button that uses custom JavaScript
 * @param {object} instance         The instance of the FormIO component
 * @param {bool} disable            flag to enable/disable the button
 */
function updateSubmitButton(instance, disable) {
    updateSubmitButton(instance, instance.component.key, disable);
}

/**
 * Enable/Disable a formio button that uses custom JavaScript
 * @param {object} instance         The instance of the FormIO component
 * @param {text} keyName            The API name (key) of the FormIO component
 * @param {bool} disable            flag to enable/disable the button
 */
function updateSubmitButton(instance, keyName, disable) {
    if (!isEmpty(instance)) {
        var submit = getRootComponent(instance.root, keyName);
        if (!isEmpty(submit)) {
            submit.component.disabled = disable;
            instance.redraw();
        }
    }
}

/**
  *Used to send a silent notification for a form that has the recipients address in the form data
  * {object} config
  * - {text}    subject           subject line of the message
  * - {text}    message           the message to send
  * - {text}    userId            userId of the person so we can retrieve their notification settings and email/phone
  * - {text}    forceEmail        if the user does not have CanEmail turned on, force send an email anyway
  * - {text}    forceText         if the user does not have CanText turned on, force send a text anyway
  * - {text}    email             email address to send the message to
  * - {text}    phoneNumber       Phone number to send a text message to
  * - {text}    formDataId        the form data id that has the location of the userId. The JSON path is usually required so we can find the path of userIds
  * - {text}    jsonPathToUserIds the json path to the id of the user you want to send to. Ex data.perparedByUserId
  * - {text}    notificationType  used to identify the notification type:
  *                 DCEvent,
  *                 DCUserEvent,
  *                 EmergencyNotification,
  *                 FormEvent,
  *                 FormUserEvent,
  *                 IonError,
  *                 Loneworker,
  *                 NoType,
  *                 PasswordReset,
  *                 ScheduledTask,
  *                 Test,
  *                 TriggeredAlert,
  *                 UserInitiated
  * - {text}    userSecurityStamp the users token for API authoization. TODO: deprecate this
  * - {object}  instance          instance component from the button so we can disable/enable, preventing duplicate submissions
  * - {text}    successCallback   called on success
  * - {text}    failureCallback   called on failure
  * - {text}    apiRepsonseId     name of the component to display errors on failure
*/
function sendNotificationFromForm(config) {
    var notificationBody = {
        subject: config.subject,
        message: config.message,
        userId: config.userId,
        forceEmail: config.forceEmail,
        forceText: config.forceText,
        emailAddress: config.email,
        phoneNumber: config.phoneNumber,
        formDataId: config.formDataId,
        jsonPathToUserIds: config.jsonPathToUserIds,
        notificationType: config.notificationType
    };
    callAPIWithJSONBody('/api/v1/notify', notificationBody, config.instance, config.successCallback, config.failureCallback, config.apiRepsonseId);
}   

/**
* Call a API with a POST and JSON body that get serialized.
* @param configs see sendNotificationFromForm
* @param callbackSuccessMethod = optional what to do on success
* @param callbackFailureMethod = optional what to do on failure
*/
function multiSendNotificationFromForm(configs, callbackSuccessMethod, callbackFailureMethod) {
    if (configs === null)
        return;
    //This function iterates of the all the configs and will either fail or keep running and call the final success method
    function sendNextNotification(index) {
        let config = configs[index];

        if (index === configs.length - 1) { //last one call the final success
            config.successCallback = callbackSuccessMethod;
        } else {
            config.successCallback = function () {
                sendNextNotification(index + 1); //we call our own success to iterate
            }
        }
        config.failureCallback = callbackFailureMethod; // failure is a failure
        sendNotificationFromForm(config); //call regular email api
    }
    //Kick it off
    sendNextNotification(0);
}


/**
* Call a API with a POST and JSON body that get serialized.
* @param pHref = Where
* @param pBody =What
* @param {object} instance     The instance of the FormIO component
* @param callbackSuccessMethod = optional what to do on success
* @paramcallbackFailureMethod = optional what to do on failure
*/
function callAPIWithJSONBody(pHref, pBody, instance, callbackSuccessMethod, callbackFailureMethod, apiRepsonseId) {
    //what to do if there is an error
    function handleError(error) {
        if (apiRepsonseId != null)
            formSubmissionAPIFailure(instance.root, error, apiRepsonseId, isAdmin);
        //reenable the button
        updateSubmitButton(instance, true);
        //if there is a failure method then use it
        if (callbackFailureMethod !== null)
            callbackFailureMethod(error);
    }
    //if a button is passed disable it
    updateSubmitButton(instance, false);
    //This is configured for API's that expect a POST of JSON data that is authorized for use
    var fetchConfig = {
        body: JSON.stringify(pBody),
        headers: global_fetchHeaders,
        method: 'POST'
    };
    fetch(pHref, fetchConfig).then(function (response) {
        if (!response.ok) {
            response.json().then(function (data) {
                handleError(data.message);
            });
        }
        else {
            response.json().then(returnData => {
                //reenable the button
                updateSubmitButton(instance, true);
                //do callback if it exists
                if (callbackSuccessMethod !== null)
                    callbackSuccessMethod(returnData);
            });
        }
    }).catch(error => {
        handleError(error);
    });
}

/**
 * Remove Duplicate Options And Redraw The Component 
 * Primarily used in data map components
 * @param {object} instanceRoot     The root instance of the FormIO form
 * @param {string} dataName         Name of the HTML component to update
*/
function removeDuplicateOptionsAndRedraw(instance, dataName) {
    var component = getRootComponent(instance.root, dataName);
    var map = {};
    $(`select[name="data[${dataName}]"] option`).each(function () {
        if (map[this.value]) {
            $(this).remove();
            component.redraw();
        }
        map[this.value] = true;
    });
}

/**
 * Return a list of options from an HTML component
 * Primarily used in data map components
 * @param {string} dataName       Name of the HTML component to update
 * @param {string} option         Options to select e.g. option / option:selected
*/
function getSelectNameOption(dataName, option) {
    var result = '';
    if (isEmpty(option))
        result = $(`select[name="data[${dataName}]"]`);
    else
        result = $(`select[name="data[${dataName}]"] ${option}`);
    return result;
}

/**
 * Update the path of Uploaded files
 * Formio upload component path example: https://test.jacobsion.com/api/file/uploadfile/true?baseUrl=https%3A%2F%2Ftest.jacobsion.com%2F&project=&form=/This%20form%20is%20being%20used%20for%20test%20purposes%20only-a709227b-9fc2-4e01-af16-e07d1ea1a9c1.pdf
 * @param {object} instanceRoot     The root instance of the FormIO form
*/
function updateUploadedFilePath(instance) {
    if (!isEmpty(instance)) {
        //Get the uploaded file path that is configured in the file component > File > Directory
        var filePath = instance.component.dir;
        if (!isEmpty(filePath)) {
            //Convert file path to url path: Z:\\Uploads\\Forms > Uploads/Forms
            var converted = filePath.split(':')[1];
            if (!isEmpty(converted)) filePath = trimChar(replace(converted, '\\', '/'), '/');
        }
        //Find link so we can update the url
        var linkElement = $(`.formio-component-${instance.info.attr.id} a`);
        for (var l = 0; l < linkElement.length; l++) {
            var link = linkElement[l];
            if (!isEmpty(link) && link.href.indexOf('/Files/') < 1) {
                //Convert the querystring parameters and retrieve the base url and file uploaded
                var qs = getUrlVars(decodeURIComponent(link.href));
                //Create the new file path
                var fileName = trimChar(qs.form, '/');
                if (!isEmpty(fileName)) {
                    var newUrl = `/Files/${trimChar(filePath, '/')}/${fileName}`;
                    //Couldn't remove the Formio events, so we'll create a new one and remove the old link 
                    link.insertAdjacentHTML('afterend', `<a href="${newUrl}" target="_blank">${link.innerHTML}</a>`);
                    link.remove();
                }
            }
        }
    }
}

/**
 * Fix the chosen drop-down if the select component is using a prefix
 * @param {object} instance     The instance of the FormIO select component
*/
function chosenPrefixMargin(instance) {
    $(() => {
        $(`.formio-component-${instance.info.attr.id} div.choices__list--dropdown`).css("margin-top", "40px");
    });
}

/**
 * Delete a form
 * @param {object} instance     The instance of the FormIO select component
*/
function deleteForm(formId, name) {
    if (confirm('Are you sure you want to delete this form?')) {
        loading('Please Wait', 'Deleting ' + name + '...');
        return fetch('/api/forms/deleteform/', {
            body: JSON.stringify({
                'FormId': formId
            }),
            method: 'DELETE',
            mode: 'cors',
            headers: global_fetchHeaders,
        }).then((response) => {
            loadingStop();
            //Redirect if successful
            if (response.status != 200) {
                //todo: unlock the submit button and fix errors
                notify({
                    type: 'error',
                    message: 'There was an error deleting the form: ' + response.statusText,
                    theme: 'light',
                    icon: '<i class="fa fa-file-code-o fa-2x"></i>',
                    delay: 5000,
                    autoHide: true
                });
            } else if (response.status == 200) {
                notify({
                    type: 'success',
                    message: 'Form was deleted successfully',
                    theme: 'light',
                    icon: '<i class="fa fa-wpforms fa-2x"></i>',
                    delay: 5000,
                    autoHide: true
                });

                var qs = getUrlQuerystring(window.location.href);
                parent.location.href = `/admin/dc/FormsData/?${qs}`;
            }
        });
    }
}

/**
 * Delete selected form data
 * @param {object} instance     The instance of the FormIO select component
 * @param {text} dcid           The dashboard id
*/
function deleteFormData(formDataId, dcid) {
    if (confirm('Are you sure you want to delete this form data?')) {
        loading('Please Wait', 'Deleting Form Data...');
        return fetch(`/api/forms/deleteformdata/${formDataId}`, {
            method: 'DELETE',
            mode: 'cors',
            headers: global_fetchHeaders,
        }).then((response) => {
            loadingStop();
            //Redirect if successful
            if (response.status != 200) {
                //todo: unlock the submit button and fix errors
                notify({
                    type: 'error',
                    message: 'There was an error deleting the form data: ' + response.statusText,
                    theme: 'light',
                    icon: '<i class="fa fa-file-code-o fa-2x"></i>',
                    delay: 5000,
                    autoHide: true
                });
            } else if (response.status == 200) {
                notify({
                    type: 'success',
                    message: 'Form data was deleted successfully',
                    theme: 'light',
                    icon: '<i class="fa fa-wpforms fa-2x"></i>',
                    delay: 5000,
                    autoHide: true
                });

                if (isEmpty(dcid)) {
                    var qs = getUrlQuerystring(window.location.href);
                    parent.location.href = `/admin/dc/FormsData/?formDataDeleted=true${qs}`;
                }
                else {
                    var qs = queryBuilder(global_qsParams[dcid]);
                    RefreshDCAsync(dcid, 'true', 'false', qs);
                }
            }
        });
    }
}

/**
 * The Formio date picker prefix functionality is broken. This will fix it
 * @param {text} apiName           The API name of the component
 * @param {text} prefix            Text to show in the prefix
*/
function fixDatePrefix(apiName, prefix) {
    var datePicker = $(`.flatpickr-input[id="${apiName}"]`);
    prefix = !isEmpty(prefix) ? prefix : datePicker[0].placeholder;
    if (!isEmpty(datePicker)) {
        var prefix = `<div class="input-group-addon input-group-prepend" id="prepend${apiName}"><span class="input-group-text">${prefix}</span></div>`;

        //Only add if the element can't be found
        var foundPrefix = $(`#prepend${apiName}`);
        if (isEmpty(foundPrefix)) {
            //Add prefix HTML before (not after) or some styles based on position for input-group will not work
            datePicker[0].before($.parseHTML(prefix)[0]);
            datePicker.parent().css('width', '');
            datePicker.parent().css('margin-left', '');
        }

        //Hide the original label
        var foundLabel = $(`.control-label[for="${apiName}"]`);
        if (!isEmpty(foundLabel)) {
            foundLabel.addClass('control-label--hidden');
            foundLabel[0].innerText = '';
        }
    }
}