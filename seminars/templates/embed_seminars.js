// Keep public namespace clean
(function(root) {

  // constructor
  function SeminarEmbedder() {
    // anything to do?
  };

  // Prototype for class controlling the embedding
  SeminarEmbedder.prototype = {
    initialized: false,

    katexAdded: false,
  };

  //////////////////////////////

  SeminarEmbedder.prototype.processEmbeds = function() {
    var targets = document.getElementsByClassName('embeddable_schedule');
    var copyTargets = []; // The return value above is mutable.... changes under our feet
    for (var i=0; i < targets.length; ++i) {
      copyTargets[i] = targets[i];
    };
    for (var i=0; i < copyTargets.length; ++i) {
      this.startEmbed(copyTargets[i]);
    };
  };

  SeminarEmbedder.prototype.startEmbed = function(target) {
    var shortname = target.getAttribute('shortname');

    if (!shortname)
      return;

    var fetchURL  = "{{ url_for('show_seminar_bare', shortname='_SHORTNAME_', _external=True, _scheme=scheme) }}".replace('_SHORTNAME_', shortname) ;

    var daterange = target.getAttribute('daterange');

    if (daterange) {
      if ("future" == daterange.toLowerCase()) {
        fetchURL += "?future=";
      } else if ("past" == daterange.toLowerCase()) {
        fetchURL += "?past=";
      } else {
        fetchURL += "?daterange=" + encodeURI(daterange);
      }
    }

    var xhr = new XMLHttpRequest();
    xhr.responseType = "document";

    self = this;
    xhr.addEventListener("load", function(event) { response = this.responseXML; self.finishEmbed(target, event, response); });
    xhr.addEventListener("error", function(event) { self.transferFailed(target, event); });
    xhr.addEventListener("abort", function(event) { self.transferCanceled(target, event); });
    xhr.addEventListener("progress", function(event) { self.updateProgress(target, event); });

    console.log("Initiating fetch from " + fetchURL);
    xhr.open("GET", fetchURL, true);

    // Mark it as processing by changing the class
    target.classList.remove("embeddable_schedule");
    target.classList.add("embedding_in_prog_schedule");

    xhr.send();

  }

  SeminarEmbedder.prototype.finishEmbed = function(target, event, response) {

    target.innerText = "";
    target.appendChild(response.getElementById('embed_content'));

    // Mark it as processed by changing the class
    target.classList.remove("embedding_in_prog_schedule");
    target.classList.add("embedded_schedule");
  }

  SeminarEmbedder.prototype.updateProgress = function(target, event) {
    target.innerText += ".";
  }

  SeminarEmbedder.prototype.transferCanceled = function(target, event) {
    target.innerText = "Transfer cancelled for embedding!";

    // Mark it as failed by changing the class
    target.classList.remove("embedding_in_prog_schedule");
    target.classList.add("embedding_failed_schedule");
  }

  SeminarEmbedder.prototype.transferFailed = function(target, event) {
    target.innerText = "Transfer failed for embedding!";

    // Mark it as failed by changing the class
    target.classList.remove("embedding_in_prog_schedule");
    target.classList.add("embedding_failed_schedule");
  }

  //////////////////////////////

  SeminarEmbedder.prototype.addCSS = function(href, opts) {

    var head = document.head;
    var link = document.createElement("link");

    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = href;

    if (opts) {
      for (var prop in opts) {
        link[prop] = opts[prop];
      };
    };

    head.appendChild(link);
  }

  SeminarEmbedder.prototype.addJS = function(src, opts) {

    var head = document.head;
    var script = document.createElement("script");

    script.type = "text/javascript";
    script.src = src;

    if (opts) {
      for (var prop in opts) {
        script[prop] = opts[prop];
      };
    };

    head.appendChild(script);
  }

  SeminarEmbedder.prototype.addKatex = function() {
    if (this.katexAdded)
      return;

    if ( window.hasOwnProperty('katex') ) {
      // Assume whoever wrote the embedding page knows what they're doing
      this.katexAdded = true;
      return;
    };


    this.addJS("{{ url_for('static', filename='katex-custom.js', _external=True, _scheme=scheme) }}");

    this.addCSS("https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/katex.min.css",
                {"integrity": "sha384-yFRtMMDnQtDRO8rLpMIKrtPCD5jdktao2TV19YiZYWMDkUR5GQZR/NOVTdquEx1j",
                 "crossOrigin": "anonymous"});
    this.addJS("https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/katex.min.js",
               {"defer": true,
                "integrity": "sha384-9Nhn55MVVN0/4OFx7EE5kpFBPsEMZxKTCnA+4fqDmg12eCTqGi6+BB2LjY8brQxJ",
                "crossOrigin": "anonymous"});
    this.addJS("https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/contrib/auto-render.min.js",
               {"defer": true,
                "integrity": "sha384-kWPLUVMOks5AQFrykwIup5lo0m3iMkkHrD0uJ4H5cjeGihAutqP0yW0J6dpFiVkI",
                "crossOrigin": "anonymous"});
    this.addCSS("https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/contrib/copy-tex.css");
    this.addJS("https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/contrib/copy-tex.min.js",
               {"defer": true,
                "integrity": "sha384-XhWAe6BtVcvEdS3FFKT7Mcft4HJjPqMQvi5V4YhzH9Qxw497jC13TupOEvjoIPy7",
                "crossOrigin": "anonymous"});

  }

  SeminarEmbedder.prototype.initialize = function(opts) {
    if (this.initialized)
      return;

    if (opts && opts.hasOwnProperty('addCSS') && opts['addCSS']) {
      this.addCSS("{{ url_for('css', _external=True, _scheme=scheme) }}");
    };

    // addKatex is idempotent
    this.addKatex();

    this.initialized = true;

    this.processEmbeds();
  }

  //////////////////////////////

  var seminarEmbedder = new SeminarEmbedder();

  root['seminarEmbedder'] = seminarEmbedder;

})(this);
