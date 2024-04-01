const dailyImage = document.querySelector('#daily-image');
const dailyImageShadow = document.createElement('img');

dailyImageShadow.id = 'daily-image-shadow';
dailyImageShadow.src = dailyImage.src;

dailyImage.insertAdjacentElement('afterend', dailyImageShadow);