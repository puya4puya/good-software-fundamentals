/* =====================================================================
   Reusable quiz widget — retrieval practice with instant feedback.
   Usage: drop a <div class="quiz" data-quiz='[...]'></div> with a JSON
   array of questions, then this script renders + grades it.

   Question shape:
     { "q": "question text",
       "options": ["a", "b", "c", "d"],
       "answer": 2,                       // index of correct option
       "why": "one-line explanation shown after answering" }
   ===================================================================== */
(function () {
  function render(container) {
    const questions = JSON.parse(container.dataset.quiz);
    container.classList.add("quiz-widget");
    questions.forEach((item, qi) => {
      const block = document.createElement("div");
      block.className = "quiz-q";
      block.innerHTML = `<p class="quiz-prompt"><span class="qn">${qi + 1}.</span> ${item.q}</p>`;
      const opts = document.createElement("div");
      opts.className = "quiz-opts";
      item.options.forEach((opt, oi) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = opt;
        btn.addEventListener("click", () => grade(block, opts, item, oi));
        opts.appendChild(btn);
      });
      block.appendChild(opts);
      const fb = document.createElement("p");
      fb.className = "quiz-feedback";
      block.appendChild(fb);
      container.appendChild(block);
    });
  }

  function grade(block, opts, item, chosen) {
    if (block.dataset.done) return;
    block.dataset.done = "1";
    const buttons = opts.querySelectorAll("button");
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === item.answer) b.classList.add("correct");
      else if (i === chosen) b.classList.add("wrong");
    });
    const fb = block.querySelector(".quiz-feedback");
    const ok = chosen === item.answer;
    fb.innerHTML = (ok ? "✓ Corect. " : "✗ Nu chiar. ") + item.why;
    fb.classList.add(ok ? "ok" : "no");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".quiz[data-quiz]").forEach(render);
  });
})();
