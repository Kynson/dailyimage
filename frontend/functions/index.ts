export const onRequest: PagesFunction<{}> = async (context) => {
	const url = new URL(context.request.url);
  const asset = await context.env.ASSETS.fetch(url);

  return new Response(
    (await asset.text()).replace('{imageURL}', 'https://source.unsplash.com/random'),
    {
      headers: {
        ...asset.headers,
        'X-Test-Header': 'This is a test message'
      }
    }
  )
}