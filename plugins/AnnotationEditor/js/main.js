require({
    packages: [
        {
            location: '../plugins/AnnotationEditor/jslib/underscore',
            name: 'underscore', main: 'underscore'
        },
        {
            location: '../plugins/AnnotationEditor/jslib/jquery',
            name: 'jquery', main: 'jquery'
        },
        {
            location: '../plugins/AnnotationEditor/jslib/jqueryui',
            name: 'jqueryui',
        },
        {
            location: '../plugins/AnnotationEditor/jslib/genevalidator',
            name: 'genevalidator', main: 'gvapi'
        },
        {
            location: '../plugins/AnnotationEditor/jslib/tripleclick',
            name: 'tripleclick', main: 'jquery.tripleclick'
        },
        {
            location: '../plugins/AnnotationEditor/jslib/bootstrap',
            name: 'bootstrap', main: 'bootstrap'
        }
    ]
},
[],
function() {

    define.amd.jQuery = true;

    define([
        'dojo/_base/declare',
        'dojo/_base/array',
        'dojo/dom-construct',
        'dijit/form/button',
        'jquery/jquery',
        'underscore/underscore',
        'AnnotationEditor/FeatureEdgeMatchManager',
        'AnnotationEditor/FeatureSelectionManager',
        'AnnotationEditor/TrackConfigTransformer',
        'JBrowse/Browser',
        'JBrowse/Plugin'
    ],
        function(
            declare,
            array,
            domConstruct,
            dijitButton,
            $,
            _,
            FeatureEdgeMatchManager,
            FeatureSelectionManager,
            TrackConfigTransformer,
            Browser,
            JBrowsePlugin
            // EditTrack
        ) {
return declare(JBrowsePlugin,
{
    constructor: function( args ) {
        console.log("plugin AnnotationEditor");

        // Get a handle to the main JBrowse instance.
        var browser = this.browser;
        var thisB = this;
        console.dir(browser);
        var modalDiv = "<div class='modal fade' id='sequence' tabindex='-1'><div class='modal-dialog modal-lg'><div class='modal-content'><div class='modal-header'><h4 class='modal-title'>Reference Sequence ...</h4></div><div class='modal-body'><pre class='pre-scrollable'></pre></div>";
        modalDiv = modalDiv + "<div class='modal-footer'>";
        modalDiv = modalDiv + "<div class='btn btn-default pull-left' data-toggle='buttons'>";
        modalDiv = modalDiv + "<label class='btn btn-default' data-sequence-type='protein' ng-click='browser.getEditTrack().showSequenceDialog()'><input type='radio'>Protien</label>";
        modalDiv = modalDiv + "<label class='btn btn-default' data-sequence-type='CDS' ng-click='browser.getEditTrack().showSequenceDialog()'><input type='radio'>CDS</label>";
        modalDiv = modalDiv + "<label class='btn btn-default' data-sequence-type='cDNA' ng-click='browser.getEditTrack().showSequenceDialog()'><input type='radio'>cDNA</label>";
        modalDiv = modalDiv + "<label class='btn btn-default active' data-sequence-type='genomic' ng-click='browser.getEditTrack().showSequenceDialog()'><input type='radio'>Genomic</label>";
        modalDiv = modalDiv + "</div>";
        modalDiv = modalDiv + "<div id='bp' class='input-group col-sm-3 pull-left' style='display:none;'><span class='input-group-addon'>±</span>";
        modalDiv = modalDiv + "<input type='number' class='form-control'>"
        modalDiv = modalDiv + "</div>";
        modalDiv = modalDiv + "<button class='btn btn-default pull-right' id='download'><i class='fa fa-download'></i>Download</button>"
        modalDiv = modalDiv + "</div>";
        modalDiv = modalDiv + "</div></div></div>"
        var modal = domConstruct.toDom(modalDiv);
        domConstruct.place(modal, 'GenomeBrowser', "before");

        // Convert HTMLFeature tracks to DraggableHTMLFeatures. Features in
        // DraggableHTMLFeatures tracks are selectable and draggable.
        this.trackTransformer = new TrackConfigTransformer({browser: browser});
        array.forEach(browser.config.tracks, function(e) {
            this.trackTransformer.transform(e);
        }.bind(this));

        // Setup selection management: if selection is made in edit track,
        // any selection in other tracks is deselected, and vice versa.
        browser.featSelectionManager = new FeatureSelectionManager();  // for all other tracks
        browser.annotSelectionManager = new FeatureSelectionManager(); // for edit track
        browser.featSelectionManager.addMutualExclusion(browser.annotSelectionManager);
        browser.annotSelectionManager.addMutualExclusion(browser.featSelectionManager);

        // Setup feature edge matching.
        FeatureEdgeMatchManager.setBrowser(browser);
        FeatureEdgeMatchManager.addSelectionManager(browser.featSelectionManager);
        FeatureEdgeMatchManager.addSelectionManager(browser.annotSelectionManager);

        var tracks = [
              {
                 "height"   : 64,
                 "compress" : 0,
                 "key" : "Edit",
                 "phase" : 0,
                 "autocomplete" : "none",
                 "label" : "Edit",
                 "type" : "AnnotationEditor/View/Track/EditTrack",
                 "store" : "scratchpad",
                 "storeClass": "AnnotationEditor/Store/SeqFeature/ScratchPad",
                 "style" : {
                     "className" : "transcript",
                     "renderClassName" : "transcript-overlay",
                     "subfeatureClasses" : {
                         "three_prime_UTR" : "three_prime_UTR",
                         "five_prime_UTR"  : "five_prime_UTR",
                         "exon" : "exon",
                         "CDS"  : "CDS",
                         "non_canonical_splice_site" : "non-canonical-splice-site",
                         "non_canonical_translation_start_site" : "non-canonical-translation-start-site",
                         "non_canonical_translation_stop_site"  : "non-canonical-translation-stop-site"
                     }
                 },
                 "subfeatures" : 1,
                 "pinned" : true,
                 "containerID":   'GenomeBrowser',
                 "show_nav":       false,
                 "show_overview":  false,
                 "show_tracklist": true
              }
           ]
        var config = {
            containerID:   'GenomeBrowser',
            show_nav:       false,
            show_overview:  false,
            show_tracklist: true
        }
        var track = {
            "label": "Edit",
            "type": "AnnotationEditor/View/Track/EditTrack",
            "defaultForStoreTypes": ["AnnotationEditor/Store/SeqFeature/ScratchPad"]
        }
        browser.registerTrackType(track);
        browser.registerTrackType({
            type:                 'AnnotationEditor/View/Track/DraggableHTMLFeatures',
            defaultForStoreTypes: [ 'JBrowse/Store/SeqFeature/NCList',
                                    'JBrowse/Store/SeqFeature/GFF3',
                                  ],
            label: 'AnnotationEditor Features'
        });
        browser.afterMilestone('loadConfig', function () {
            browser.config.show_tracklist = false;
            browser.addTracks(tracks);
        });

        var smartScrollLeft = function (event) {
            var selected = browser.featSelectionManager.getSelection();
            if (selected.length == 0) {
                selected = browser.annotSelectionManager.getSelection();
            }

            if (selected.length == 0) {
                var offset = -40;
                if (event.shiftKey) {
                  offset *= 5;
                }
                browser.view.keySlideX(offset);
            } else {
                scrollToPreviousEdge(selected);
            }
        }

        var smartScrollRight = function (event) {
            var selected = browser.featSelectionManager.getSelection();
            if (selected.length == 0) {
                selected = browser.annotSelectionManager.getSelection();
            }

            if (selected.length == 0) {
                var offset = 40;
                if (event.shiftKey) {
                  offset *= 5;
                }
                browser.view.keySlideX(offset);
            } else {
                scrollToNextEdge(selected);
            }
        }

        var scrollToNextEdge = function (selected) {
            var vregion = browser.view.visibleRegion();
            var coordinate = (vregion.start - vregion.end)/2;
            if (selected && (selected.length > 0)) {
                var selfeat = selected[0].feature;
                while (selfeat.parent()) {
                    selfeat = selfeat.parent();
                }
                var coordDelta = Number.MAX_VALUE;
                var pmin = selfeat.get("start");
                var pmax = selfeat.get('end');
                if ((coordinate - pmax)) {
                    browser.view.centerAtBase(pmin, false);
                } else {
                    var childfeats = selfeat.children();
                    for (var i = 0; i < childfeats.length; i++) {
                        var cfeat = childfeats[i];
                        var cmin = cfeat.get('start');
                        var cmax = cfeat.get('end');
                        if ((cmin - coordinate) > 10) {
                            coordDelta = Math.min(coordDelta, cmin - coordinate);
                        }
                        if ((cmax - coordinate) > 10) {
                            coordDelta = Math.min(coordDelta, cmax - coordinate);
                        }
                    }
                    if (coordDelta != Number.MAX_VALUE) {
                        var newCenter = coordinate + coordDelta;
                        browser.view.centerAtBase(newCenter, false);
                    }
                }
            }
        }

        var scrollToPreviousEdge = function (selected) {
            var vregion = browser.view.visibleRegion();
            var coordinate = (vregion.start - vregion.end)/2;
            if (selected && (selected.length > 0)) {
                var selfeat = selected[0].feature;
                while (selfeat.parent()) {
                    selfeat = selfeat.parent();
                }
                var coordDelta = Number.MAX_VALUE;
                var pmin = selfeat.get("start");
                var pmax = selfeat.get('end');
                if ((coordinate - pmax)) {
                    browser.view.centerAtBase(pmax, false);
                } else {
                    var childfeats = selfeat.children();
                    for (var i = 0; i < childfeats.length; i++) {
                        var cfeat = childfeats[i];
                        var cmin = cfeat.get('start');
                        var cmax = cfeat.get('end');
                        if ((coordinate - cmin) > 10) {
                            coordDelta = Math.min(coordDelta, coordinate - cmin);
                        }
                        if ((coordinate - cmax) > 10) {
                            coordDelta = Math.min(coordDelta, coordinate - cmax);
                        }
                    }
                    if (coordDelta != Number.MAX_VALUE) {
                        var newCenter = coordinate - coordDelta;
                        browser.view.centerAtBase(newCenter, false);
                    }
                }
            }
        }

        browser.afterMilestone('initView', function() {
            var trackConfs = browser.trackConfigsByName["DNA"];
            trackConfs.type = "AnnotationEditor/View/Track/Sequence";
            browser.trackConfigsByName[ trackConfs.label ] = trackConfs;
            var stores_scratchpad = {
                    type: "AnnotationEditor/Store/SeqFeature/ScratchPad",
                    features : []
            };
            browser.addStoreConfig('scratchpad', stores_scratchpad);

            var navBox = dojo.byId('navbox');
            var moveLeft = dojo.byId('moveLeft');
            var moveRight = dojo.byId('moveRight');
            navbox.removeChild(moveLeft);
            var modLeft = document.createElement("img");
            modLeft.src = 'img/Empty.png';
            modLeft.id = "moveLeft";
            modLeft.className = "icon nav";
            navbox.insertBefore(modLeft, moveRight);
            dojo.connect(modLeft, 'onclick', this, function(event) {
              dojo.stopEvent(event);
              smartScrollLeft(event);
            });
            navbox.removeChild(moveRight);
            var bigZoomOut = dojo.byId('bigZoomOut');
            var modRight = document.createElement("img");
            modRight.src = 'img/Empty.png';
            modRight.id = "moveRight";
            modRight.className = "icon nav";
            navbox.insertBefore(modRight, navbox.childNodes[3]);
            dojo.connect(modRight, 'onclick', this, function(event) {
              dojo.stopEvent(event);
              smartScrollRight(event);
            })
            browser.undoButton = new dijitButton(
            {
                title: "Undo",
                label: "Undo",
                id: "undo-btn",
                onClick: dojo.hitch( thisB, function(event) {
                    thisB.store.undo();
                    dojo.stopEvent(event);
                })
            }, dojo.create('button',{},navBox));
            var moveRight = dojo.byId('moveRight');
            var handle = dojo.connect( moveRight, "click", this,
                  function(event) {
                      dojo.stopEvent(event);
                      this.view.slide(0.9);
                  });
            dojo.disconnect(handle);
        })
    }
});
});
});
