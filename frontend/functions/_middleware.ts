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

class PromptHandler {
  prompt?: string;

  constructor(prompt: string) {
    this.prompt = prompt;
  }

  element(promptElement: Element) {
    if (!this.prompt) {
      promptElement.setAttribute('class', 'error');
    }

    promptElement.setInnerContent(this.prompt || 'Error: Fail to get prompt used to generate the image');
  }
}

function arrayBufferToBase64DataURL(arrayBuffer: ArrayBuffer): string {
  const view = new Uint8Array(arrayBuffer);

  const rawBinaryString = view.reduce(
    (accumulatedBinaryString, currentByte) => accumulatedBinaryString + String.fromCharCode(currentByte),
    ''
  );

  const mimeType = rawBinaryString.startsWith('<svg') ? 'image/svg+xml' : 'image/webp';

  return `data:${mimeType};base64,${btoa(rawBinaryString)}`;
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

  const imageOfTheDayArrayBuffer = await imageOfTheDayResponse?.arrayBuffer()
    || await context.env.ASSETS
        .fetch(new URL('broken-image.svg', requestURL))
        .then((response) => response.arrayBuffer());

  const imageOfTheDaySrc = arrayBufferToBase64DataURL(imageOfTheDayArrayBuffer || new Uint8Array());
  const imageOfTheDayPrompt = imageOfTheDayResponse?.customMetadata?.prompt || '';

  const htmlRewriter = new HTMLRewriter();
  const renderedIndexPageResponse = htmlRewriter
    .on('img#daily-image', new DailyImageHandler(imageOfTheDaySrc, imageOfTheDayPrompt))
    .on('p#prompt', new PromptHandler(imageOfTheDayPrompt))
    .transform(indexPageResponse);
  
  renderedIndexPageResponse.headers.set('content-type', 'text/html');

  return renderedIndexPageResponse;
}