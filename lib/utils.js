function fixTrackTitle(trackString) {
  if (trackString.split(",").length > 1 && trackString.indexOf(", The -") !== -1) {
    var titleArtist = trackString.split(",")[0];
    var titleSong = trackString.split(",")[1];

    // Fix the "The" issue
    titleSong = trackString.split(",")[1].split(" - ")[1];
    titleArtist = "The " + titleArtist;

    return titleArtist + " - " + titleSong;
  } else {
    return trackString;
  }
}

module.exports.fixTrackTitle = fixTrackTitle;
