console.log("checkAsnwers.js is connected");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("submitAnswers").addEventListener("click", function() {

    const selectedAnswers = document.querySelectorAll("input[type='radio']:checked");

    selectedAnswers.forEach(answer => {
      const answerDiv = answer.closest(".answer");
      const isCorrect = answer.getAttribute("data-correct") === "true";

      if (isCorrect) {
        answerDiv.classList.add("answer--correct");
      } else {
        answerDiv.classList.add("answer--incorrect");
      }
    });
  });
});