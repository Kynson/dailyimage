import { initSync, png2webp } from '@kynsonszetau/png2webp';
import png2webpWasm from '@kynsonszetau/png2webp/png2webp_bg.wasm';

initSync(png2webpWasm);

async function generateStableDiffusionPrompt(
  modelRunner: Ai,
  llamaModelInput: AiTextGenerationInput
) {
  let { response: llamaResponse } = (await modelRunner.run(
    '@cf/meta/llama-2-7b-chat-fp16',
    llamaModelInput
  )) as { response: string };
  llamaResponse = llamaResponse.match(/<prompt>(.*)<\/prompt>/m)?.[1] ?? '';

  return llamaResponse;
}

async function readableStreamToUint8Array(
  readableStream: ReadableStream<Uint8Array>
) {
  const chunks = await Array.fromAsync(readableStream);
  const length = chunks.reduce((previous, current) => {
    return previous + current.length;
  }, 0);

  const result = new Uint8Array(length);

  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

async function generateImage(
  modelRunner: Ai,
  stableDiffusionInput: AiTextToImageInput
): Promise<Uint8Array> {
  return await modelRunner.run(
    '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    stableDiffusionInput
  );
}

export default {
  // The scheduled handler is invoked at the interval set in our wrangler.toml's
  // [[triggers]] configuration.
  async scheduled(
    _event: ScheduledEvent,
    environment: Environment,
    _context: ExecutionContext
  ): Promise<void> {
    const modelRunner = environment.AI;

    const llamaModelInput: AiTextGenerationInput = {
      stream: false,
      // Maximum and minimum seed values defined at https://developers.cloudflare.com/workers-ai/models/llama-2-7b-chat-fp16/
      seed: Math.floor(Math.random() * 9999999999 + 1),
      messages: [
        {
          role: 'system',
          content: `
Context: You are a prompt engineer who produce and write accurate and professional prompts or instructions that is used in image generation model based on users\' instructions.
Requirement: Prompts you write should not include words or lead to generation of images that are related to violent, pornography, or any other inappropriate themes. Surround your generated prompt with <prompt></prompt>.
Example: <prompt>A photo of a plane flying in the clouds</prompt>`,
        },
        {
          role: 'user',
          content: `
Instruction: Write one concise image generation prompt in for stable diffusion. You should first choose two items first from 'List of themes or subjects' as theme or subject. Then choose one style from 'List of styles'. Finally, combine the chosen items into one single prompt.
List of themes or subjects: cat, technology, dog, scenery, flowers, computer, server, car, weather, rain, sunny, thunderstorm
List of styles: art, cartoon, portrait
Prompt:
`,
        },
      ],
    };
    const prompt = await generateStableDiffusionPrompt(
      modelRunner,
      llamaModelInput
    );

    const stableDiffusionInput: AiTextToImageInput = {
      prompt,
      num_steps: 20,
      guidance: 7,
    };
    // Override the type for the moment as @cloudflare/workers-types is incorrect
    const imageReadableStream = (await generateImage(
      modelRunner,
      stableDiffusionInput
    )) as unknown as ReadableStream<Uint8Array>;

    const image = await readableStreamToUint8Array(imageReadableStream);
    const webpImage = png2webp(image);

    // Get date in format dd-mm-yyyy
    const currentDay = new Date().toLocaleDateString('nl', {
      dateStyle: 'short',
    });

    await environment.IMAGE_BUCKET.put(currentDay, webpImage, {
      customMetadata: { prompt },
    });
  },
};
