let currentStep = 1;

function nextStep() {
  document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
  currentStep++;
  document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
}

function submitForm() {
  const data = {
    name: name.value,
    sin: sin.value,
    virtue: virtue.value,
    trait: trait.value,
    dream: dream.value
  };

  console.log('VERDICT DATA:', data);

  Telegram.WebApp.showAlert("Досье передано. Дьявол ждёт вас в чате.");
}
