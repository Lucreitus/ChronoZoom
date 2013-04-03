﻿/// <reference path="czservice.js" />

var CZ = (function (CZ, $) {
    var Authoring = CZ.Authoring = CZ.Authoring || {};
    var UI = Authoring.UI = Authoring.UI || {};


    /**
     * Appends editable field of content item to element.
     * @param {Object}   form          Target DOM element found with jQuery.
     * @param {Boolean}  addSeparator  Indicates whether separator is required.
     */
    function _addContentItemForm(form, addSeparator) {
        var container = $("<div class='cz-auth-ci-container'></div>");

        var label = $("<label style='display: block'>Media source</label>");

        var title = $("<p style='display: block'>" +
           "<label style='display: block'>Title</label>" +
           "<input class='cz-auth-ci-title' style='display: block' type='text'/>" +
           "</p>");

        var description = $("<p style='display: block'>" +
          "<label style='display: block'>Description</label>" +
          "<textarea class='cz-auth-ci-description' style='display: block' />" +
          "</p>");

        var mediaSource = $("<p style='display: block'>" +
           "<label style='display: block'>Media source</label>" +
           "<input class='cz-auth-ci-media-source' style='display: block' type='text'/>" +
           "</p> ");

        var mediaType = $("<p style='display: block'>" +
         "<label style='display: block'>Media type</label>" +
         "<select class='cz-auth-ci-media-type' style='display: block'>" +
         "<option value='image'>Image</option>" +
         "<option value='pdf'>PDF</option> " +
         "<option value='video'>Video</option>" +
         "<option value='audio'>Audio</option>" +
         "</select>" +
         "</p>");

        var removeBtn = $("<button>Remove content item</button>");
        removeBtn[0].onclick = function () {
            container.remove();
        };

        container.append(title);
        container.append(description);
        container.append(mediaSource);
        container.append(mediaType);
        container.append(removeBtn);

        if (addSeparator == true) {
            var separator = $("<hr />");
            container.append(separator);
        }

        form.append(container);
    }

    /**
     * Returns an array of contentItems filled with user data.
     * @return {Array}  An array of contentItems.
     */
    function _getContentItemsData() {
        var contentItems = [];

        var containers = $(".cz-auth-ci-container");
        $(".cz-auth-ci-container").each(function () {
            var CItitleInput = $(this).find(".cz-auth-ci-title");;
            var mediaInput = $(this).find(".cz-auth-ci-media-source");
            var mediaTypeInput = $(this).find(".cz-auth-ci-media-type option");
            var descriptionInput = $(this).find(".cz-auth-ci-description");
            var id = $(this).attr("cz-auth-ci-id") || "";

            var selected = mediaTypeInput[0];

            for (var i = 0; i < mediaTypeInput.length; i++)
                if (mediaTypeInput[i].selected) {
                    selected = mediaTypeInput[i];
                }

            contentItems.push({
                title: CItitleInput.val(),
                description: descriptionInput.val(),
                uri: mediaInput.val(),
                mediaType: selected.text,
                id: id,
                parent: ""
            });
        });

        return contentItems;
    }

    /**
     * Fills contentItem form with data taken from given contentItem.
     * @param {Object}  form         Target DOM element found with jQuery.
     * @param {Object}  contentItem  ContentItem which data is taken.
     */
    function _fillContentItemForm(form, contentItem) {
        var titleInput = form.find(".cz-auth-ci-title");
        var mediaInput = form.find(".cz-auth-ci-media-source");
        var mediaTypeInput = form.find(".cz-auth-ci-media-type option");
        var descriptionInput = form.find(".cz-auth-ci-description");
        var mediaType = contentItem.mediaType.toLowerCase();

        if (mediaType === "picture") {
            mediaType = "image";
        }

        form.attr("cz-auth-ci-id", contentItem.id);
        titleInput.val(contentItem.title);
        mediaInput.val(contentItem.uri);
        descriptionInput.val(contentItem.description);
        mediaTypeInput.each(function (option) {
            if (this.value === mediaType) {
                $(this).attr("selected", "selected");
                return;
            }
        });
    }
   
    $.extend(UI, {
        showCreateTimelineForm: function (t) {
            var isCancel = true;
            var titleInput = $("#timelineTitleInput");
            var startInput = $("#timelineStartInput").spinner();
            var endInput = $("#timelineEndInput").spinner();

            titleInput.val(t.title);
            startInput.val(t.x);
            endInput.val(t.x + t.width);

            $("#createTimelineForm").dialog({
                title: "create timeline",
                modal: true,
                height: 600,
                width: 600,
                buttons: {
                    "save and close": function () {
                        isCancel = false;

                        var self = this;

                        CZ.Authoring.updateTimeline(t, {
                            title: titleInput.val(),
                            start: startInput.val(),
                            end: endInput.val(),
                        }).then(
                            function (success) {
                                $(self).dialog("close");
                            },
                            function (error) {
                                alert("Unable to save changes. Please try again later.");
                                console.log(error);
                            });
                    }
                },
                close: function () {
                    if (isCancel) {
                        CZ.Authoring.removeTimeline(t);
                    }
                    CZ.Authoring._isActive = false;
                    $("a:contains('create timeline')").removeClass("active");
                }
            });
        },

        showEditTimelineForm: function (t) {
            var titleInput = $("#timelineTitleInput").spinner();
            var startInput = $("#timelineStartInput").spinner();
            var endInput = $("#timelineEndInput").spinner();

            titleInput.val(t.title);
            startInput.val(t.x);
            endInput.val(t.x + t.width);

            $("#createTimelineForm").dialog({
                title: "edit timeline",
                modal: true,
                height: 600,
                width: 600,
                buttons: {
                    "save and close": function () {
                        var self = this;
                        CZ.Authoring.updateTimeline(t, {
                            title: titleInput.val(),
                            start: startInput.val(),
                            end: endInput.val(),
                        }).then(
                            function (success) {
                                $(self).dialog("close");
                            },
                            function (error) {
                                alert("Unable to save changes. Please try again later.");
                                console.log(error);
                            });    
                    },
                    "delete": function () {
                        if (confirm("Are you sure want to delete timeline and all of its nested timelines and exhibits? Delete can't be undone!")) {
                            CZ.Authoring.removeTimeline(t);
                            $(this).dialog("close");
                        }
                    }
                },
                close: function () {                    
                    CZ.Authoring._isActive = false;
                    $("a:contains('edit timeline')").removeClass("active");
                }
            });
        },

        showCreateExhibitForm: function (e) {
            var isCancel = true;
            var titleInput = $("#exhibitTitleInput");
            var dateInput = $("#exhibitDateInput").spinner();
            
            titleInput.val(e.title);
            dateInput.val(e.x);

            $("#createExhibitForm").dialog({
                title: "create exhibit",
                modal: true,
                height: 600,
                width: 600,
                buttons: {
                    "save and close": function () {
                        var contentItems = _getContentItemsData();
                        
                        CZ.Authoring.updateExhibit(e, {
                            title: titleInput.val(),
                            date: dateInput.val(),
                            contentItems: contentItems
                        });
                        isCancel = false;
                        $(this).dialog("close");
                    },
                    "add content item": function () {
                        if ($(this).find(".cz-auth-ci-container").length < infodotMaxContentItemsCount)
                            _addContentItemForm($(this), true);
                    }
                },
                close: function () {
                    if (isCancel) {
                        CZ.Authoring.removeExhibit(e);
                    }
                    CZ.Authoring._isActive = false;
                    $("a:contains('create exhibit')").removeClass("active");

                    $(this).find(".cz-auth-ci-container")
                            .each(function () {
                                $(this).remove();
                            });
                }
            });
        },

        showEditExhibitForm: function (e) {
            var titleInput = $("#exhibitTitleInput");
            var dateInput = $("#exhibitDateInput").spinner();

            titleInput.val(e.title);
            dateInput.val(e.x);

            var contentItems = e.contentItems;

            for (var i = 0; i < contentItems.length; i++) {
                _addContentItemForm($("#createExhibitForm"), true);
            }

            $(".cz-auth-ci-container").each(function (index) {
                _fillContentItemForm($(this), contentItems[index]);
            });

            $("#createExhibitForm").dialog({
                title: "edit exhibit",
                modal: true,
                height: 600,
                width: 600,
                buttons: {
                    "save and close": function () {
                        contentItems = _getContentItemsData(e);                        
                        
                        CZ.Authoring.updateExhibit(e, {
                            title: titleInput.val(),
                            date: dateInput.val(),
                            contentItems: contentItems
                        });
                        $(this).dialog("close");

                        $(this).find(".cz-auth-ci-container")
                           .each(function () {
                               $(this).remove();
                           });
                    },
                    "delete": function () {
                        if (confirm("Are you sure want to delete exhibit and all of its content items? Delete can't be undone!")) {
                            CZ.Authoring.removeExhibit(e);
                            $(this).dialog("close");
                        }
                    },
                    "add content item": function () {
                        if ($(this).find(".cz-auth-ci-container").length < infodotMaxContentItemsCount)
                            _addContentItemForm();
                    }
                },
                close: function () {
                    CZ.Authoring._isActive = false;
                    $("a:contains('edit exhibit')").removeClass("active");

                    $(this).find(".cz-auth-ci-container")
                           .each(function () {
                               $(this).remove();
                           });
                }
            });
        },

        showEditContentItemForm: function (c, e) {
            var titleInput = $("#contentItemTitleInput");
            var mediaInput = $("#contentItemMediaSourceInput");
            var descriptionInput = $("#contentItemDescriptionInput");
            var mediaTypeInput = $("#contentItemMediaTypeInput option");
            var mediaType = c.contentItem.mediaType.toLowerCase();
            if (mediaType === "picture") {
                mediaType = "image";
            }
            titleInput.val(c.contentItem.title);
            mediaInput.val(c.contentItem.uri);
            descriptionInput.val(c.contentItem.description);
            mediaTypeInput.each(function (option) {
                if (this.value === mediaType) {
                    $(this).attr("selected", "selected");
                    return;
                }
            });                     
            
            
            $("#editContentItemForm").dialog({
                title: "Edit content item",
                modal: true,
                height: 600,
                width: 600,
                buttons: {
                    "save and close": function () {
                        var selected = mediaTypeInput[0];
                        
                        for (var i = 1; i < mediaTypeInput.length; i++)
                            if (mediaTypeInput[i].selected) {
                                selected = mediaTypeInput[i];
                            }
                        console.log(c,e);
                        CZ.Authoring.updateContentItem(c, e, {
                            title: titleInput.val(),
                            uri: mediaInput.val(),
                            mediaType: selected.text,
                            description: descriptionInput.val()
                        });
                        $(this).dialog("close");
                    },
                    "delete": function () {
                        if (confirm("Are you sure want to delete content item? Delete can't be undone!")) {
                            CZ.Authoring.removeContentItem(c);
                            $(this).dialog("close");
                        }
                    }
                },
                close: function () {
                    CZ.Authoring._isActive = false;
                    $("a:contains('edit exhibit')").removeClass("active");
                }
            });
        },


        // Mouseup handlers.

        createTimeline: function() {
            // skip authoring during ongoing dynamic layout animation
            if (animatingElements.length != 0) {
                return;
            }

            CZ.Authoring._isActive = (CZ.Authoring.mode !== "createTimeline") || !CZ.Authoring._isActive;
            CZ.Authoring.mode = "createTimeline";

            $("div #footer-authoring > a").removeClass("active");

            if (CZ.Authoring._isActive) {
                $("a:contains('create timeline')").addClass("active");
            } else {
                $("a:contains('create timeline')").removeClass("active");
            }
        },

        editTimeline: function () {
            // skip authoring during ongoing dynamic layout animation
            if (animatingElements.length != 0) {
                return;
            }

            CZ.Authoring._isActive = (CZ.Authoring.mode !== "editTimeline") || !CZ.Authoring._isActive;
            CZ.Authoring.mode = "editTimeline";

            $("div #footer-authoring > a").removeClass("active");

            if (CZ.Authoring._isActive) {
                $("a:contains('edit timeline')").addClass("active");
            } else {
                $("a:contains('edit timeline')").removeClass("active");
            }
        },

        createExhibit: function () {
            // skip authoring during ongoing dynamic layout animation
            if (animatingElements.length != 0) {
                return;
            }

            CZ.Authoring._isActive = (CZ.Authoring.mode !== "createExhibit") || !CZ.Authoring._isActive;
            CZ.Authoring.mode = "createExhibit";

            $("div #footer-authoring > a").removeClass("active");

            if (CZ.Authoring._isActive) {
                $("a:contains('create exhibit')").addClass("active");
            } else {
                $("a:contains('create exhibit')").removeClass("active");
            }
        },

        editExhibit: function () {
            // skip authoring during ongoing dynamic layout animation
            if (animatingElements.length != 0) {
                return;
            }

            CZ.Authoring._isActive = (CZ.Authoring.mode !== "editExhibit") || !CZ.Authoring._isActive;
            CZ.Authoring.mode = "editExhibit";

            $("div #footer-authoring > a").removeClass("active");

            if (CZ.Authoring._isActive) {
                $("a:contains('edit exhibit')").addClass("active");
            } else {
                $("a:contains('edit exhibit')").removeClass("active");
            }
        }
    });
    
    return CZ;
})(CZ || {}, jQuery);