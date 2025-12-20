document.getElementById("hellForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    name: name.value,
    sin: sin.value,
    virtue: virtue.value,
    trait: trait.value,
    dream: dream.value
  };

  console.log("HELL DOSSIER:", data);

  Telegram.WebApp.showAlert(
    "Досье принято.\nСотрудник паспортного стола Ада приступил к обработке."
  );
});
