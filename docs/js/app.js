/* House Hack Calculator — local-first, no backend. */
(function () {
  "use strict";

  var KEY = "househack.v1";
  var FIELDS = ["price", "units", "ownerUnit", "downPct", "rate", "term",
                "pmi", "tax", "ins", "rent", "vacPct", "maint", "capex",
                "util", "mgmt", "altRent"];

  var DEFAULTS = {
    price: 450000, units: 3, ownerUnit: "1", downPct: 5, rate: 7,
    term: "360", pmi: 178, tax: 6000, ins: 1800, rent: 1600,
    vacPct: 5, maint: 200, capex: 200, util: 150, mgmt: 0, altRent: 1800
  };

  function $(id) { return document.getElementById(id); }

  function num(id) {
    var v = parseFloat($(id).value);
    return isNaN(v) ? 0 : v;
  }

  function money(n) {
    var neg = n < 0;
    var s = "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
    return neg ? "-" + s : s;
  }

  function load() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    var src = saved || DEFAULTS;
    FIELDS.forEach(function (f) {
      if (src[f] !== undefined && src[f] !== null) $(f).value = src[f];
    });
    syncOwnerUnits();
  }

  function save() {
    var o = {};
    FIELDS.forEach(function (f) { o[f] = $(f).value; });
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }

  function syncOwnerUnits() {
    var n = Math.min(4, Math.max(2, Math.round(num("units")) || 2));
    var sel = $("ownerUnit");
    var cur = parseInt(sel.value, 10) || 1;
    sel.innerHTML = "";
    for (var i = 1; i <= n; i++) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = "Unit " + i;
      sel.appendChild(opt);
    }
    sel.value = String(Math.min(cur, n));
  }

  function monthlyPI(loan, annualRate, months) {
    if (loan <= 0 || months <= 0) return 0;
    var r = annualRate / 100 / 12;
    if (r <= 0) return loan / months;
    var f = Math.pow(1 + r, months);
    return loan * r * f / (f - 1);
  }

  function row(k, v, cls, note) {
    var html = '<div class="bk-row' + (cls ? " " + cls : "") + '">' +
      '<span class="k">' + k + '</span><span class="v">' + v + "</span></div>";
    if (note) html += '<div class="bk-note">' + note + "</div>";
    return html;
  }

  function calc() {
    var price = num("price");
    var units = Math.min(4, Math.max(2, Math.round(num("units")) || 2));
    var downPct = Math.min(100, Math.max(0, num("downPct")));
    var down = price * downPct / 100;
    var loan = Math.max(0, price - down);
    var pi = monthlyPI(loan, num("rate"), parseInt($("term").value, 10) || 360);
    var taxM = num("tax") / 12;
    var insM = num("ins") / 12;
    var pmiM = downPct >= 20 ? 0 : num("pmi");
    var piti = pi + taxM + insM + pmiM;

    var rentedUnits = units - 1;
    var grossRent = rentedUnits * num("rent");
    var vacLoss = grossRent * (num("vacPct") / 100);
    var effRent = grossRent - vacLoss;

    var maint = num("maint"), capex = num("capex"),
        util = num("util"), mgmt = num("mgmt");
    var opex = maint + capex + util + mgmt;

    var totalCost = piti + opex;
    var oop = totalCost - effRent;
    var altRent = num("altRent");
    var savings = altRent - oop;

    /* ---- verdict ---- */
    var vMain = $("verdictMain"), vSub = $("verdictSub");
    vMain.className = "verdict-main";
    if (totalCost <= 0 && effRent <= 0) {
      vMain.textContent = "Fill in the numbers →";
      vSub.textContent = "";
    } else if (oop <= 0) {
      vMain.classList.add("free");
      vMain.textContent = "LIVING FREE + " + money(-oop) + "/mo";
      vSub.textContent = "The tenants cover everything and pay you " + money(-oop) +
        " a month to live there. This is the dream hack.";
    } else if (savings > 0) {
      vMain.classList.add("win");
      vMain.textContent = "CHEAPER THAN RENTING by " + money(savings) + "/mo";
      vSub.textContent = "You pay " + money(oop) + "/mo out of pocket vs. " +
        money(altRent) + "/mo renting — and you're building equity.";
    } else if (savings === 0) {
      vMain.classList.add("win");
      vMain.textContent = "BREAKS EVEN WITH RENTING";
      vSub.textContent = "Same monthly cost as renting, but every payment builds your equity.";
    } else {
      vMain.classList.add("lose");
      vMain.textContent = "DOESN'T HACK";
      vSub.textContent = "This costs " + money(-savings) + "/mo MORE than renting. " +
        "Raise rents, find a cheaper deal, or put more down.";
    }

    /* ---- line-by-line math ---- */
    var h = "";
    h += row("Purchase price", money(price));
    h += row("Down payment (" + downPct + "%)", money(down));
    h += row("Loan amount", money(loan));
    h += row("Principal & interest", money(pi) + "/mo",
      "", "at " + num("rate") + "% for " + ((parseInt($("term").value, 10) || 360) / 12) + " years");
    h += row("Property tax", money(taxM) + "/mo");
    h += row("Insurance", money(insM) + "/mo");
    h += row("PMI", money(pmiM) + "/mo",
      "", downPct >= 20 ? "no PMI at 20%+ down — nice" : "PMI drops off once you hit 20% equity");
    h += row("PITI subtotal", money(piti) + "/mo", "subtotal");
    h += row("Maintenance", money(maint) + "/mo");
    h += row("CapEx reserve", money(capex) + "/mo");
    h += row("Utilities (owner-paid)", money(util) + "/mo");
    h += row("Management", money(mgmt) + "/mo",
      "", mgmt === 0 ? "self-managed — your sweat equity" : "");
    h += row("TOTAL MONTHLY COST", money(totalCost) + "/mo", "subtotal");
    h += row("Rental income (" + rentedUnits + " unit" + (rentedUnits > 1 ? "s" : "") +
      " × " + money(num("rent")) + ")", money(grossRent) + "/mo");
    h += row("Less vacancy (" + num("vacPct") + "%)", "−" + money(vacLoss) + "/mo");
    h += row("Effective rental income", money(effRent) + "/mo", "subtotal neg");
    h += row("YOUR OUT-OF-POCKET", money(oop) + "/mo", "total",
      "total cost minus rental income — the number that matters");
    h += row("vs. renting at " + money(altRent) + "/mo",
      (savings >= 0 ? "save " : "costs ") + money(Math.abs(savings)) + "/mo");
    $("breakdown").innerHTML = h;

    /* ---- snapshot ---- */
    $("sTotal").textContent = money(totalCost) + "/mo";
    var sI = $("sIncome");
    sI.textContent = money(effRent) + "/mo";
    sI.className = "v good";
    var sO = $("sOop");
    sO.textContent = money(oop) + "/mo";
    sO.className = "v " + (oop <= 0 ? "good" : "warn");
    var sV = $("sVs");
    sV.textContent = (savings >= 0 ? "Save " : "Lose ") + money(Math.abs(savings)) + "/mo";
    sV.className = "v " + (savings >= 0 ? "good" : "bad");

    save();
  }

  FIELDS.forEach(function (f) {
    $(f).addEventListener("input", function () {
      if (f === "units") syncOwnerUnits();
      calc();
    });
    $(f).addEventListener("change", function () {
      if (f === "units") syncOwnerUnits();
      calc();
    });
  });

  $("resetBtn").addEventListener("click", function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    FIELDS.forEach(function (f) { $(f).value = DEFAULTS[f]; });
    syncOwnerUnits();
    calc();
  });

  load();
  calc();
})();
