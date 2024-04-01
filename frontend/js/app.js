import './shadow.js';

const dailyImage = document.querySelector('#daily-image');

const copyImageButton = document.querySelector('#copy-image');
const downloadImageButton = document.querySelector('#download-image');

const copyStatusDialog = document.querySelector('#copy-status-dialog');

copyImageButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(dailyImage.src);
  } catch (error) {
    copyStatusDialog.querySelector('p').textContent = 'Failed to copy Data URL';
    console.error(error);
  }

  copyStatusDialog.showModal();
});
downloadImageButton.addEventListener('click', async () => {
  const imageBlob = await fetch(dailyImage.src)
    .then(response => response.blob());
  const imageObjectURL = URL.createObjectURL(imageBlob);

  const downloadAnchor = document.createElement('a');
  downloadAnchor.style.display = 'none';
  downloadAnchor.href = imageObjectURL;
  downloadAnchor.download = 'daily-image.webp';
  downloadAnchor.click();

  URL.revokeObjectURL(url);
  downloadAnchor.remove();
});