/* =====================================================================
   SQL exercise widget — write a real query, run it against an in-browser
   database, get instant pass/fail feedback. Runs entirely client-side via
   sql.js (SQLite compiled to WebAssembly, vendored in ./vendor/).

   Markup contract, one <div class="sql-exercise"> per exercise:
     data-seed  = SQL to set up the sandbox table(s) for this exercise
     data-check = a reference SELECT whose result the user's query must match
     data-order-sensitive = "true" to require matching row order (omit otherwise)
   Children (any order): .sql-exercise-prompt, .sql-exercise-input (<textarea>),
   [data-action="run"], [data-action="reveal"], .sql-exercise-output

   Note: this runs on SQLite, not MySQL — for the SELECT/WHERE basics taught
   in early lessons the syntax is identical, but don't reuse this for
   MySQL-specific syntax (backticks, LIMIT/OFFSET quirks, date functions)
   without checking sql.js supports it.
   ===================================================================== */
(function () {
  var sqlReady = null;

  function loadSqlJs() {
    if (sqlReady) return sqlReady;
    sqlReady = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = relPath("vendor/sql-wasm.js");
      script.onload = function () {
        window
          .initSqlJs({ locateFile: function (f) { return relPath("vendor/" + f); } })
          .then(resolve, reject);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return sqlReady;
  }

  // fontsize.js and sql-exercise.js are always loaded from ../assets/ by a lesson,
  // so vendor files live one level under whatever assets/ this script came from.
  function relPath(suffix) {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      if (/sql-exercise\.js$/.test(scripts[i].src)) {
        return scripts[i].src.replace(/sql-exercise\.js$/, suffix);
      }
    }
    return "assets/" + suffix;
  }

  function runQuery(SQL, seed, query) {
    var db = new SQL.Database();
    db.run(seed);
    var result = db.exec(query); // array of {columns, values}; last SELECT wins
    db.close();
    return result.length ? result[result.length - 1] : { columns: [], values: [] };
  }

  function normalize(result, orderSensitive) {
    var rows = result.values.map(function (row) { return JSON.stringify(row); });
    if (!orderSensitive) rows.sort();
    return { columns: result.columns.slice().sort(), rows: rows };
  }

  function sameResult(a, b, orderSensitive) {
    var na = normalize(a, orderSensitive), nb = normalize(b, orderSensitive);
    return JSON.stringify(na.columns) === JSON.stringify(nb.columns) &&
           JSON.stringify(na.rows) === JSON.stringify(nb.rows);
  }

  function renderTable(result) {
    if (!result.columns.length) return "<p><em>Fără rezultate.</em></p>";
    var head = "<tr>" + result.columns.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr>";
    var body = result.values.map(function (row) {
      return "<tr>" + row.map(function (v) { return "<td>" + (v === null ? "<em>NULL</em>" : String(v)) + "</td>"; }).join("") + "</tr>";
    }).join("");
    return "<table>" + head + body + "</table>";
  }

  function initExercise(el, SQL) {
    var seed = el.getAttribute("data-seed");
    var check = el.getAttribute("data-check");
    var orderSensitive = el.getAttribute("data-order-sensitive") === "true";
    var input = el.querySelector(".sql-exercise-input");
    var output = el.querySelector(".sql-exercise-output");
    var runBtn = el.querySelector('[data-action="run"]');
    var revealBtn = el.querySelector('[data-action="reveal"]');

    runBtn.disabled = false;

    runBtn.addEventListener("click", function () {
      var query = input.value.trim();
      if (!query) { output.innerHTML = "<p class=\"sql-exercise-msg is-error\">Scrie un query mai întâi.</p>"; return; }
      try {
        var actual = runQuery(SQL, seed, query);
        var expected = runQuery(SQL, seed, check);
        var ok = sameResult(actual, expected, orderSensitive);
        output.innerHTML =
          "<p class=\"sql-exercise-msg " + (ok ? "is-ok" : "is-error") + "\">" +
          (ok ? "✓ Corect!" : "✗ Nu încă — rezultatul de mai jos nu se potrivește cu ce se cere.") +
          "</p>" + renderTable(actual);
      } catch (err) {
        output.innerHTML = "<p class=\"sql-exercise-msg is-error\">Eroare SQL: " + err.message + "</p>";
      }
    });

    input.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runBtn.click();
    });

    if (revealBtn) {
      revealBtn.addEventListener("click", function () {
        var shown = el.getAttribute("data-revealed") === "true";
        el.setAttribute("data-revealed", shown ? "false" : "true");
        revealBtn.textContent = shown ? "Arată răspunsul" : "Ascunde răspunsul";
        var box = el.querySelector(".sql-exercise-answer");
        if (!box) {
          box = document.createElement("pre");
          box.className = "sql-exercise-answer";
          box.innerHTML = "<code>" + check.replace(/</g, "&lt;") + "</code>";
          output.parentNode.insertBefore(box, output);
        }
        box.style.display = shown ? "none" : "block";
      });
    }
  }

  function init() {
    var exercises = document.querySelectorAll(".sql-exercise");
    if (!exercises.length) return;
    exercises.forEach(function (el) {
      var runBtn = el.querySelector('[data-action="run"]');
      if (runBtn) { runBtn.disabled = true; runBtn.textContent = "Se încarcă…"; }
    });
    loadSqlJs().then(function (SQL) {
      exercises.forEach(function (el) {
        initExercise(el, SQL);
        var runBtn = el.querySelector('[data-action="run"]');
        if (runBtn) runBtn.textContent = "Rulează";
      });
    }).catch(function (err) {
      exercises.forEach(function (el) {
        el.querySelector(".sql-exercise-output").innerHTML =
          "<p class=\"sql-exercise-msg is-error\">Nu s-a putut încărca motorul SQL (" + err.message + "). Reîncarcă pagina.</p>";
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
