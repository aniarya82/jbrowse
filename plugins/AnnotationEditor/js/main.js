require({

  packages: [
    { name: 'jqueryui', location: '../plugins/AnnotationEditor/jslib/jqueryui' },
    { name: 'jquery', location: '../plugins/AnnotationEditor/jslib/jquery', main: 'jquery' }
            ]
      },
      [],
      function() {

define.amd.jQuery = true;

define([
          'dojo/_base/declare',
          'dojo/_base/lang',
          'dojo/dom-construct',
          'dojo/dom-class',
          'dojo/query',
          'dojo/_base/window',
          'dojo/_base/array',
          'dijit/registry',
          'dijit/Menu',
          'dijit/MenuItem',
          'dijit/MenuSeparator',
          'dijit/CheckedMenuItem',
          'dijit/PopupMenuItem',
          'dijit/form/DropDownButton',
          'dijit/DropDownMenu',
          'dijit/form/Button',
          'JBrowse/Plugin',
          'JBrowse/GenomeView',
          'AnnotationEditor/View/Track/LocationScale',
          'AnnotationEditor/FeatureEdgeMatchManager',
          'AnnotationEditor/FeatureSelectionManager',
          'AnnotationEditor/TrackConfigTransformer',
          'AnnotationEditor/View/Track/AnnotTrack',
          'AnnotationEditor/View/TrackList/Hierarchical',
          'AnnotationEditor/View/TrackList/Faceted',
          'AnnotationEditor/InformationEditor',
          'AnnotationEditor/View/Dialog/Help',
          'JBrowse/View/FileDialog/TrackList/GFF3Driver',
          'JBrowse/CodonTable',
          'dojo/io-query',
          'jquery/jquery',
          'lazyload/lazyload'
       ],
       function( declare,
                lang,
                domConstruct,
                domClass,
                query,
                win,
                array,
                dijitRegistry,
                dijitMenu,
                dijitMenuItem,
                dijitMenuSeparator,
                dijitCheckedMenuItem,
                dijitPopupMenuItem,
                dijitDropDownButton,
                dijitDropDownMenu,
                dijitButton,
                JBPlugin,
                GenomeView,
                LocationScaleTrack,
                FeatureEdgeMatchManager,
                FeatureSelectionManager,
                TrackConfigTransformer,
                AnnotTrack,
                Hierarchical,
                Faceted,
                InformationEditor,
                HelpMixin,
                GFF3Driver,
                CodonTable,
                ioQuery,
                $,
                LazyLoad ) {
return declare( JBrowsePlugin,
{
    constructor: function( args ) {
        var thisB = this;
        // var browser = args.browser;
        var browser = this.browser;  // this.browser set in Plugin superclass constructor
        [
          'plugins/AnnotationEditor/jslib/bbop/bbop.js',
          'plugins/AnnotationEditor/jslib/bbop/golr.js',
          'plugins/AnnotationEditor/jslib/bbop/jquery.js',
          'plugins/AnnotationEditor/jslib/bbop/search_box.js',
          'plugins/AnnotationEditor/jslib/websocket/spring-websocket.js'
        ].forEach(function(src) {
          var script = document.createElement('script');
          script.src = src;
          script.async = false;
          document.head.appendChild(script);
        });

        // do anything you need to initialize your plugin here
        console.log( "plugin: AnnotationEditor" );

        // hand the browser object to the feature edge match manager
        FeatureEdgeMatchManager.setBrowser( browser );

        this.featSelectionManager = new FeatureSelectionManager();
        this.annotSelectionManager = new FeatureSelectionManager();
        this.trackTransformer = new TrackConfigTransformer({ browser: browser });
        this.annotSelectionManager.addMutualExclusion(this.featSelectionManager);
        this.featSelectionManager.addMutualExclusion(this.annotSelectionManager);

        FeatureEdgeMatchManager.addSelectionManager(this.featSelectionManager);
        FeatureEdgeMatchManager.addSelectionManager(this.annotSelectionManager);

        browser.registerTrackType({
          type: 'AnnotationEditor/View/Track/DraggableHTMLFeatures',
          defaultForStoreTypes: [ 'JBrowse/Store/SeqFeature/NCList',
                                  'JBrowse/Store/SeqFeature/GFF3',
                                  'AnnotationEditor/Store/SeqFeature/ApolloGFF3'
                                ],
          label: 'Annotation Feature'
        });
        browser.registerTrackType({
          type: 'AnnotationEditor/View/Track/DraggableAlignments',
          defaultForStoreTypes: [ 'JBrowse/Store/SeqFeature/BAM' ],
          label: 'Annotation Alignments'
        });
        browser.registerTrackType({
          type: 'AnnotationEditor/View/Track/SequenceTrack',
          defaultForStoreTypes: [ 'JBrowse/Store/Sequence/StaticChunked' ],
          label: 'Annotation Sequence'
        });

        // transform track configs from vanilla JBrowse to WebApollo:
        // type: "JBrowse/View/Track/HTMLFeatures" ==> "WebApollo/View/Track/DraggableHTMLFeatures"
        //
        array.forEach(browser.config.tracks,function(e) { thisB.trackTransformer.transform(e); });

        // update track selector to WebApollo's if needed
        // if no track selector set, use WebApollo's Hierarchical selector
        if (!browser.config.trackSelector) {
            browser.config.trackSelector = { type: 'AnnotationEditor/View/TrackList/Hierarchical' };
        }
        // if using JBrowse's Hierarchical selector, switch to WebApollo's
        else if (browser.config.trackSelector.type == "Hierarchical") {
            browser.config.trackSelector.type = 'AnnotationEditor/View/TrackList/Hierarchical';
        }
        // if using JBrowse's Hierarchical selector, switch to WebApollo's
        else if (browser.config.trackSelector.type == "Faceted") {
            browser.config.trackSelector.type = 'AnnotationEditor/View/TrackList/Faceted';
        }

        var newTrack = {category: "Miscellaneous",key: "EditTrack - Segments",type: 'AnnotationEditor/View/Track/DraggableHTMLFeatures'};
        console.dir(browser);

        // var trackConfig = {
        //     "type" : "FeatureTrack",
        //     "category" : "Miscellaneous",
        //     "urlTemplate" : "tracks/ExampleFeatures/{refseq}/trackData.json",
        //     "storeClass" : "JBrowse/Store/SeqFeature/NCList",
        //     "track" : "ExampleFeatures",
        //     "label" : "ExampleFeatures",
        //     "feature" : [
        //         "remark"
        //     ],
        //     "compress" : 0,
        //     "style" : {
        //         "className" : "feature2"
        //     },
        //     "key" : "HTMLFeatures - Example Features",
        //     "autocomplete" : "all"
        // }
        // browser.view.renderTrack(trackConfig);

        browser.afterMilestone('initView', function() {
          var view = browser.view;
          view.oldOnResize = view.onResize;
          console.log('Zero: '+browser.view.tracks.length);
          var trackConfig = {
              "type" : "FeatureTrack",
              "category" : "Miscellaneous",
              "urlTemplate" : "tracks/ExampleFeatures/{refseq}/trackData.json",
              // "storeClass" : "JBrowse/Store/SeqFeature/NCList",
              "store" : "JBrowse/Store/SeqFeature/ApolloGFF3",
              "track" : "ExampleTEstFeatures",
              "label" : "ExampleTEstFeatures",
              "feature" : [
                  "remark"
              ],
              "compress" : 0,
              "style" : {
                  "className" : "feature2"
              },
              "key" : "HTMLFeatures - ETETE",
              "name": "Still thinking",
              "autocomplete" : "all"
          }
          var someNew = new LocationScaleTrack({
              label: "somethisk",
              labelClass: "resalabel",
              posHeight: 10,
              browser: browser,
              refSeq: refSeq
          })
          // browser.view.renderTrack(trackConfig);
          // browser.view.addOverviewTrack(someNew);
          browser.view.updateTrackList();
        });

        var cds_frame_toggle = new dijitCheckedMenuItem(
          {
            label: "Color by CDS frame",
            checked: browser.cookie("colorCdsByFrame")=="true",
            onClick: function(event) {
              if(this.get("checked")) domClass.add(win.body(), "colorCds");
              else domClass.remove(win.body(),"colorCds");
              browser.cookie("colorCdsByFrame", this.get("checked")?"true":"false");
            }
          });
        browser.addGlobalMenuItem( 'view', cds_frame_toggle );

    },
    updateLabels: function() {
        if(!this._showLabels) {
            query('.track-label').style('visibility','hidden');
        }
        else {
            query('.track-label').style('visibility','visible');
        }
        this.browser.view.updateScroll();
    },

    /**
     *  get the GenomeView's user annotation track
     *  WebApollo assumes there is only one AnnotTrack
     *     if there are multiple AnnotTracks, getAnnotTrack returns first one found
     *         iterating through tracks list
     */
    getAnnotTrack: function()  {
        if (this.browser && this.browser.view && this.browser.view.tracks)  {
            var tracks = this.browser.view.tracks;
            for (var i = 0; i < tracks.length; i++)  {
                // should be doing instanceof here, but class setup is not being cooperative
                if (tracks[i].isWebApolloAnnotTrack)  {
                    return tracks[i];
                }
            }
        }
        return null;
    },

    /**
     *  get the GenomeView's sequence track
     *  WebApollo assumes there is only one SequenceTrack
     *     if there are multiple SequenceTracks, getSequenceTrack returns first one found
     *         iterating through tracks list
     */
    getSequenceTrack: function()  {
        if (this.browser && this.browser.view && this.browser.view.tracks)  {
            var tracks = this.browser.view.tracks;
            for (var i = 0; i < tracks.length; i++)  {
                // should be doing instanceof here, but class setup is not being cooperative
                if (tracks[i].isWebApolloSequenceTrack)  {
                    return tracks[i];
                }
            }
        }
        return null;
    }

});
});
});
