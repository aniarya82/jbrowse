define([
    'dojo/_base/declare',
    'JBrowse/View/Track/BlockBased',
    'AnnotationEditor/View/Track/ExportMixin',
    'AnnotationEditor/Util',
    'AnnotationEditor/CodonTable'
],
function(declare, BlockBased, ExportMixin, Util, CodonTable) {

return declare([BlockBased, ExportMixin],
/**
 * @lends JBrowse.View.Track.Sequence.prototype
 */
{
    /**
     * Track to display the underlying reference sequence, when zoomed in
     * far enough.
     *
     * @constructs
     * @extends JBrowse.View.Track.BlockBased
     */
    constructor: function (args) {
        this.trackPadding = 0;
    },

    _defaultConfig: function () {
        return {
            trackPadding: 0,
            maxExportSpan: 500000,
            showReverseStrand: true,
            showProteinTranslation: true
        };
    },

    _exportFormats: function () {
        return [{name: 'FASTA', label: 'FASTA', fileExt: 'fasta'}];
    },

    endZoom: function (destScale, destBlockBases) {
        this.clear();
    },

    setViewInfo: function (genomeView, heightUpdate, numBlocks,
                           trackDiv, widthPct, widthPx, scale) {
        this.inherited( arguments );
        this.show();
    },

    nbsp: String.fromCharCode(160),

    fillBlock: function (args) {
        var blockIndex = args.blockIndex;
        var block = args.block;
        var leftBase = args.leftBase;
        var rightBase = args.rightBase;
        var scale = args.scale;

        var charSize = this.getCharacterMeasurements();

        // if we are zoomed in far enough to draw bases, then draw them
        if (scale >= 2) {
            this.show();
            this.store.getReferenceSequence({
                ref: this.refSeq.name,
                start: leftBase - 2,
                end: rightBase + 2
            }, dojo.hitch(this, '_fillBlock', block, leftBase - 2, rightBase + 2), function () {});
            this.heightUpdate(charSize.h * 8, blockIndex);
        }
        // otherwise, hide the track
        else {
            this.hide();
            this.heightUpdate(0);
        }
        args.finishCallback();
    },

    /**
     * Highlight the given reading frame.
     */
    highlightRF: function (readingFrame) {
        // Construct jQuery selector from the given reading frame.
        var selector = '.aa';
        if (readingFrame > 0) {
            selector += '.forward'
        }
        else if (readingFrame < 0) {
            selector += '.reverse';
        }
        selector += '.frame'
        selector += (Math.abs(readingFrame) - 1);

        // Highlight it.
        //
        // There has to be a delay because `highlightRF` may be called before
        // we have had the chance to fill all blocks, and that can cause the
        // code below to raise an error (because block may still be undefined)
        // or not highlight frame at all (because aa divs have not yet been
        // attached to the DOM). This can be the case when user triggers
        // `GenomeView.scrollToNextEdge` & `GenomeView.scrollToPreviousEdge`.
        //
        // We execute the code below after 250ms. That is, we assume 8fps as
        // the worst case. If we are doing less than 8fps, then, well ...
        _.delay(_.bind(function () {
            this.unhighlightRF();
            for (var i = this.firstAttached; i <= this.lastAttached; i++)  {
                var block = this.blocks[i];
                if (block) { // sanity check
                    $(selector, block.domNode).addClass("frame_highlight");
                }
            }
        }, this), 250);
    },

    /**
     * Unhighlight reading frame.
     */
    unhighlightRF: function () {
        $(".frame_highlight").removeClass("frame_highlight");
    },

    _fillBlock: function (block, start, end, seq) {
        // make a div to contain the sequences
        var seqNode = document.createElement("div");
        seqNode.className = "sequence";
        seqNode.style.width = "100%";
        block.domNode.appendChild(seqNode);

        var blockStart = start + 2;
        var blockEnd = end - 2;
        var blockResidues = seq.substring(2, seq.length - 2);
        var blockLength = blockResidues.length;
        var extendedStart = start;
        var extendedEnd = end;
        var extendedStartResidues = seq.substring(0, seq.length - 2);
        var extendedEndResidues = seq.substring(2);

        // show translation for forward strand
        if (this.config.showProteinTranslation) {
            var aaDivs = [];
            for (var i = 0; i <= 2; i++) {
                var tstart = blockStart + i;
                var frame  = ((tstart % 3) + 3) % 3;
                var aaDiv  = this._aaDiv(extendedEndResidues, i, blockLength);
                aaDiv.className += (" frame" + frame);
                aaDiv.className += " forward";
                aaDivs[frame] = aaDiv;
            }
            for (var i = 2; i >= 0; i--) {
                var aaDiv = aaDivs[i];
                seqNode.appendChild(aaDiv);
            }
        }

        // show forward strand
        var ntDiv = this._ntDiv(blockResidues);
        ntDiv.className += ' forward';
        seqNode.appendChild(ntDiv);

        // and the reverse strand
        if (this.config.showReverseStrand) {
            var ntDiv = this._ntDiv(Util.complement(blockResidues));
            ntDiv.className += ' reverse';
            seqNode.appendChild(ntDiv);
        }

        // show translation for reverse strand
        if (this.config.showProteinTranslation && this.config.showReverseStrand) {
            var aaDivs = [];
            for (var i = 0; i < 3; i++) {
                var tstart = blockStart + i;
                var frame  = (((this.refSeq.length - blockEnd + i) % 3) + 3) % 3;
                var aaDiv = this._aaDiv(extendedStartResidues, i, blockLength, true);
                aaDiv.className += (" frame" + frame);
                aaDiv.className += " reverse";
                aaDivs[frame] = aaDiv;
            }
            for (var i = 0; i < 3; i++) {
                var aaDiv = aaDivs[i];
                seqNode.appendChild(aaDiv);
            }
        }
    },

    /**
     * Given nucleotides, returns a div containing the sequence.
     * @private
     */
    _ntDiv: function (seq) {
        var showChar  = this._shouldShowChar();
        var container = document.createElement('div');
        container.className = 'nt';
        for (var i = 0; i < seq.length; i++) {
            var ch = seq.charAt(i);
            var nt = document.createElement('span');
            nt.className = 'nt nt_' + ch;
            nt.innerHTML = showChar ? ch : this.nbsp;
            container.appendChild(nt);
        }
        return container;
    },

    /**
     * Given nucleotides, return a div containing amino acid sequence in the
     * desired frame.
     * @private
     */
    _aaDiv: function (seq, offset, blockLength, reverse) {
        if (reverse) {
            seq = Util.reverseComplement(seq);
        }

        var prefix = "";
        var suffix = "";
        for (var i = 0; i < offset; i++) {
            prefix += this.nbsp;
        }
        for (var i = 0; i < (2 - offset); i++) {
            suffix += this.nbsp;
        }

        var extra_bases = (seq.length - offset) % 3;
        var dnaRes = seq.substring(offset, seq.length - extra_bases);
        var aaResidues = dnaRes.replace(/(...)/gi, _.bind(function (triplet) {
            var aa = CodonTable[triplet];
            if (!aa) {
                /* No mapping in codon table. Two possibilities:
                 * a. There's whitespace in the triplet, thus it's not really a
                 *    codon. This can happen at edges due to padding.
                 * b. We don't know the correct the amino acid translation. For
                 *    example, if the reference sequence is hard masked and the
                 *    triplet turns up to be 'NNN'.
                 */
                aa = (triplet.indexOf(' ') >= 0) ? aa = this.nbsp : "?";
            }
            return prefix + aa + suffix;
        }, this));
        aaResidues = aaResidues.substring(0, blockLength);
        while (aaResidues.length < blockLength)  {
            aaResidues = aaResidues + this.nbsp;
        }
        if (reverse) {
            aaResidues = Util.reverse(aaResidues);
        }

        var showChar  = this._shouldShowChar();
        var container = document.createElement("div");
        container.className = 'aa';
        for (var i = 0; i < aaResidues.length; i++) {
            var ch = aaResidues.charAt(i);
            var aa = document.createElement('span');
            aa.className = 'aa aa_' + ch;
            aa.innerHTML = showChar ? ch : this.nbsp;
            container.appendChild(aa);
        }
        return container;
    },

    /**
     * @returns {Object} containing <code>h</code> and <code>w</code>,
     *      in pixels, of the characters being used for sequences
     */
    getCharacterMeasurements: function() {
        if (!this._measurements)
            this._measurements = this._measureSequenceCharacterSize(this.div);
        return this._measurements;
    },

    /**
     * Conducts a test with DOM elements to measure sequence text width
     * and height.
     * @private
     */
    _measureSequenceCharacterSize: function (containerElement) {
        var widthTest = document.createElement("div");
        widthTest.className = "sequence";
        widthTest.style.visibility = "hidden";
        var widthText = "12345678901234567890123456789012345678901234567890";
        widthTest.appendChild(document.createTextNode(widthText));
        containerElement.appendChild(widthTest);
        var result = {
            w:  widthTest.clientWidth / widthText.length,
            h: widthTest.clientHeight
        };
        containerElement.removeChild(widthTest);
        return result;
    },

    /**
     * @private
     */
    _shouldShowChar: function() {
      var ffpc = this.featureFilterParentComponent;
      var scale = ffpc.zoomLevels[ffpc.curZoom];
      var charWidthPt = this.getCharacterMeasurements().w;
      var shouldShowBase = scale >= charWidthPt;
      return shouldShowBase;
    }
  });
});
