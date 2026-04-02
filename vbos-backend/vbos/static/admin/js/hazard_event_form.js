/**
 * Show/hide Location & intensity fields based on hazard type (add/change forms).
 * Field row classes follow Django admin: .field-<fieldname>
 */
(function () {
  var HAZARD = {
    cyclone: ["magnitude"],
    earthquake: ["magnitude", "epicentre_lat", "epicentre_lon", "depth_km"],
    volcano: ["magnitude", "epicentre_lat", "epicentre_lon"],
    tsunami: ["magnitude", "epicentre_lat", "epicentre_lon", "depth_km"],
    flood: ["magnitude"],
    drought: [],
    other: ["magnitude", "epicentre_lat", "epicentre_lon", "depth_km"],
  };

  var ALL = ["magnitude", "epicentre_lat", "epicentre_lon", "depth_km"];

  function setRowVisible(fieldName, visible) {
    var row = document.querySelector(".field-" + fieldName);
    if (!row) return;
    row.style.display = visible ? "" : "none";
  }

  function apply(hazardType) {
    var allowed = HAZARD[hazardType] || HAZARD.other;
    ALL.forEach(function (f) {
      setRowVisible(f, allowed.indexOf(f) !== -1);
    });
    var fieldset = null;
    for (var i = 0; i < ALL.length; i++) {
      var el = document.querySelector(".field-" + ALL[i]);
      if (el) {
        fieldset = el.closest("fieldset");
        break;
      }
    }
    if (fieldset) {
      fieldset.style.display = allowed.length === 0 ? "none" : "";
    }
  }

  function init() {
    var sel = document.getElementById("id_hazard_type");
    if (!sel) return;
    apply(sel.value);
    sel.addEventListener("change", function () {
      apply(sel.value);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
