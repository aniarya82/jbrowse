define([
    "dojo/_base/declare",
    'JBrowse/View/TrackList/Hierarchical'
],
function(declare,Hierarchical) {
    return declare('AnnotationEditor.View.TrackList.Hierarchical',Hierarchical,
    {
        // Subclass method for track selector to remove webapollo specific tracks
        addTracks: function( tracks, inStartup ) {
            for(var i=0;i<tracks.length;i++) {
                if(tracks[i]["track type"]=="AnnotationEditor/View/Track/AnnotTrack" || tracks[i]["track type"]=="AnnotationEditor/View/Track/AnnotSequenceTrack") {
                    tracks.splice(i,1);
                    --i;
                }
            }
            //call superclass
            this.inherited(arguments);
        }
    });
});

