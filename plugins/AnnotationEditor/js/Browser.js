define([
	'dojo/_base/declare',
	'dijit/layout/BorderContainer',
	'JBrowse/Browser',
	'JBrowse/GenomeView',
	'../js/View/Track/EditTrack'
],
function(declare, dijitBorderContainer, Browser, GenomeView, EditTrack) {
	return declare(Browser, {
		constructor: function(params) {
			this.inherited(arguments);
		},

		_configDefaults: function () {
			return {
				tracks: [],
				show_overview: true
			};
		},

		initPlugins: function () {
		    return this._milestoneFunction( 'initPlugins', function( deferred ) {
		    	this.plugins = {};
		    });
		},

		initView: function() {
			return this._milestoneFunction( 'initView', function(deferred) {
				//set up top nav/overview pane and main GenomeView pane
		        dojo.addClass( this.container, "jbrowse"); // browser container has an overall .jbrowse class
		        dojo.addClass( document.body, this.config.theme || "tundra"); //< tundra dijit theme

		        var topPane = dojo.create( 'div',{ style: {overflow: 'hidden'}}, this.container );

		        var overview = dojo.create( 'div', { className: 'overview', id: 'overview' }, topPane );
		        this.overviewDiv = overview;
		        if (!this.config.show_overview) {
		        	overview.style.cssText = "display: none";
		        }
		        this.viewElem = document.createElement("div");
		        this.viewElem.className = "dragWindow";
		        this.container.appendChild(this.viewElem);

		        // HACK
		        // https://www.ibm.com/developerworks/community/blogs/hazem/entry/problem_tried_to_register_widget_with_id_xxx_but_that_id_is_already_registered1?lang=en
		        var oldWid = dijit.byId(this.config.containerID);
		        if (oldWid) {
		            oldWid.destroy();
		            oldWid = null;
		        }
		        // -- yebs

		        this.containerWidget = new dijitBorderContainer({
		            liveSplitters: false,
		            design: "sidebar",
		            gutters: false
		        }, this.container);

		        // hook up GenomeView
		        this.view = this.viewElem.view =
		            new GenomeView(
		                { browser: this,
		                  elem: this.viewElem,
		                  config: this.config.view,
		                  stripeWidth: 250,
		                  refSeq: this.refSeq,
		                  zoomLevel: 1/200
		                });

		        dojo.connect( this.view, "onFineMove",   this, "onFineMove"   );
		        dojo.connect( this.view, "onCoarseMove", this, "onCoarseMove" );

		        this.browserWidget =
		            new dijitContentPane({region: "center"}, this.viewElem);
		        dojo.connect( this.browserWidget, "resize", this,      'onResize' );
		        dojo.connect( this.browserWidget, "resize", this.view, 'onResize' );

		        //set initial location
		        this.afterMilestone( 'loadRefSeqs', dojo.hitch( this, function() {
		            this.afterMilestone( 'initTrackMetadata', dojo.hitch( this, function() {
		                this.containerWidget.startup();
		                this.onResize();
		                this.view.onResize();

		                // make our global keyboard shortcut handler
		                on(document.body, 'keydown', dojo.hitch(this, 'globalKeyHandler'));

		                // configure our event routing
		                this._initEventRouting();

		                // done with initView
		                deferred.resolve({ success: true });
		            }));
		        }));
			})
		},

		getEditTrack: function() {
			if (this._editTrack) return this._editTrack;
			if (this && this.view && this.view.tracks) {
				var tracks = this.view.tracks;
				for (var i = 0; i < tracks.length; i++) {
					if (tracks[i] instanceof EditTrack)
						return (this._editTrack = tracks[i]);
				}
			}
		}
	})
})