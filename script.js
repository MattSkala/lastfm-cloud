var API_URL = 'http://ws.audioscrobbler.com/2.0/';
var API_KEY = '3d6dae7e2ff56e17244c9d86ccd186bc';
var COLORS = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
    '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#FF9800', '#FF5722', '#607D8B'];
var FONT = 'Impact';


var App = function () {
};


App.prototype.run = function () {
  var username = 'MattSkala';
  var period = '3month';
  var limit = 70;

  var that = this;
  this.fetchTopArtists(username, period, limit, function (artists) {
    that.renderCloud(artists);
  });

  d3.select("#save").on("click", this.save);
};


App.prototype.fetchTopArtists = function (username, period, limit, callback) {
  var url = API_URL + '?method=user.gettopartists&user=' + username + '&api_key=' + API_KEY + '&format=json&limit=' + limit + '&period=' + period;
  this.request(url, function (res) {
    var artists = res.topartists ? res.topartists.artist : [];
    callback(artists);
  });
};


App.prototype.request = function (url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var res = JSON.parse(xhr.responseText);
      callback(res);
    }
  };
  xhr.open('GET', url, true);
  xhr.send();
};


App.prototype.renderCloud = function (tags) {
  var min = tags.reduce(function (prev, curr) {
    return Math.min(curr['playcount'], prev);
  }, tags[0]['playcount']);

  var max = tags.reduce(function (prev, curr) {
    return Math.max(curr['playcount'], prev);
  }, tags[0]['playcount']);

  var diff = max - min;

  var target_min = 15;
  var target_max = 50;
  var target_diff = target_max - target_min;

  var words = tags.map(function (tag) {
    var size = target_min + target_diff/diff * tag['playcount'];
    return {text: tag['name'], size: size};
  });

  this.layout = d3.layout.cloud()
      .size([600, 600])
      .words(words)
      .padding(3)
      .rotate(function() { return ~~(Math.random() * 2) * 90; })
      .font(FONT)
      .fontSize(function(d) { return d.size; })
      .on("end", this.draw.bind(this));

  this.layout.start();
};


App.prototype.draw = function (words) {
  d3.select("#content").append("svg")
      .attr("width", this.layout.size()[0])
      .attr("height", this.layout.size()[1])
    .append("g")
      .attr("transform", "translate(" + this.layout.size()[0] / 2 + "," + this.layout.size()[1] / 2 + ")")
    .selectAll("text")
      .data(words)
    .enter().append("text")
      .style("font-size", function(d) { return d.size + "px"; })
      .style("font-family", FONT)
      .style("fill", this.getColor)
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
      })
      .text(function(d) { return d.text; });
};


App.prototype.getColor = function (d, i) {
  return COLORS[i % COLORS.length];
};


App.prototype.save = function () {
  // get svg element
  var svg = document.getElementsByTagName("svg")[0];

  // get svg source
  var serializer = new XMLSerializer();
  var source = serializer.serializeToString(svg);

  // add namespaces
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // add xml declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  // set url value to a element's href attribute.
  var blob = new Blob([source], {type:'image/svg+xml'});
  saveAs(blob, 'cloud.svg');
};

app = new App();

function handleSubmitForm(form) {
  var username = form.username.value;
  var period = form.period.value;
  var limit = 70;

  var that = this;
  app.fetchTopArtists(username, period, limit, function (artists) {
    if (artists.length > 0) {
      var content = document.getElementById('content');
      content.removeChild(content.firstChild);
      app.renderCloud(artists);
    } else {
      alert('No data for this user');
    }
  });

  return false;
};
