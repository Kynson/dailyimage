class DailyImageHandler {
  imageSrc: string;
  imageAltText: string;

  constructor(imageSrc: string, imageAltText: string) {
    this.imageSrc = imageSrc;
    this.imageAltText = imageAltText;
  }

  // Must be an image
  element(imageElement: Element) {
    imageElement.setAttribute('src', this.imageSrc);
    imageElement.setAttribute('alt', this.imageAltText);
  }
}

function arrayBufferToBase64WebpURL(arrayBuffer: ArrayBuffer): string {
  const view = new Uint8Array(arrayBuffer);

  const rawBinaryString = view.reduce(
    (accumulatedBinaryString, currentByte) => accumulatedBinaryString + String.fromCharCode(currentByte),
    ''
  );

  return `data:image/webp;base64,${btoa(rawBinaryString)}`;
}

export const onRequest: PagesFunction<Environment> = async (context) => {
	const requestURL = new URL(context.request.url);

  if (requestURL.pathname !== '/') {
    return await context.next();
  }

  const indexPageResponse = await context.env.ASSETS.fetch(requestURL);
  
  // Get date in format dd-mm-yyyy
  const currentDay = new Date()
    .toLocaleDateString('nl', { dateStyle: 'short' });
  const imageOfTheDayResponse = await context.env.IMAGE_BUCKET.get(
    currentDay,
  );

  if (!imageOfTheDayResponse) {
    return new Response('Internal server error', { status: 500 });
  }

  const imageOfTheDayArrayBuffer = await imageOfTheDayResponse.arrayBuffer();

  const imageOfTheDaySrc = arrayBufferToBase64WebpURL(imageOfTheDayArrayBuffer);
  const imageOfTheDayAlt = imageOfTheDayResponse.customMetadata?.prompt || '';

  const htmlRewriter = new HTMLRewriter();
  const renderedIndexPageResponse = htmlRewriter
    .on('img#daily-image', new DailyImageHandler(imageOfTheDaySrc, imageOfTheDayAlt))
    .transform(indexPageResponse);
  
  renderedIndexPageResponse.headers.set('content-type', 'text/html');

  return renderedIndexPageResponse;
}