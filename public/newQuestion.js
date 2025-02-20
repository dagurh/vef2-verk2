document.getElementById('addAnswer').addEventListener('click', function() {
  const container = document.getElementById('answersContainer');
  const index = container.children.length - 1; 

  console.log(index);

  const answerDiv = document.createElement('div');
  answerDiv.classList.add('answer');
  answerDiv.innerHTML = `
    <input type="text" name="answers[]" required>
    <input type="radio" name="correct_answer" value="${index}" required> Rétt Svar
    <button type="button" class="removeAnswer">Eyða</button>
  `;
  
  container.appendChild(answerDiv);

  answerDiv.querySelector('.removeAnswer').addEventListener('click', function() {
    answerDiv.remove();
  });
});